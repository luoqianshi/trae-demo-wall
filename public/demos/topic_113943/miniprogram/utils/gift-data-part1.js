const part1Gifts = [
  {
    id: 'gift_001',
    name: 'Apple AirPods Pro 2 主动降噪耳机',
    category: 'electronics',
    basePrice: 1899,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 92, emotional: 70, unique: 65, budgetMatch: 0 },
    scenarios: ['日常通勤：地铁、公交上隔绝噪音，享受音乐或播客', '工作办公：开放式办公室降噪专注，提高效率', '运动健身：IPX4防水防汗，跑步健身也能佩戴', '旅行出游：长途飞行中降噪休息，旅途更舒适'],
    reason: 'AirPods Pro 2 是一款兼具实用性与品质感的礼物。主动降噪功能让TA在通勤、工作时都能享受宁静空间，通透模式又能随时融入环境。H2芯片带来卓越音质，MagSafe充电盒方便实用。送TA这份礼物，就像给TA的每一天都配上了专属BGM。',
    packaging: {
      ideas: ['用质感礼盒包装，内部铺拉菲草，附上手写卡片', '搭配一个创意耳机保护套（如卡通形象或定制名字）', '放入一个小信封，写着"愿你每天都有好心情的背景音乐"'],
      wishes: ['愿你的世界，有音乐为伴，也有我为你守护的宁静。', '每一首歌都是我想对你说的话，降噪模式开启时，只听得到心跳。']
    },
    platforms: [
      { name: 'Apple官网', price: 1899, badge: '正品保障', url: '' },
      { name: '京东自营', price: 1799, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1849, badge: '分期免息', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'top', merchantId: 'merchant_apple', merchantName: 'Apple官方' },
    image: ''
  },
  {
    id: 'gift_002',
    name: 'DW / 丹尼尔惠灵顿 经典石英手表',
    category: 'watch',
    basePrice: 1290,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 80, emotional: 85, unique: 70, budgetMatch: 0 },
    scenarios: ['商务场合：简约设计提升专业形象', '日常通勤：百搭单品，搭配各种风格', '重要时刻：纪念日、生日等特殊日子的仪式感', '情侣配对：可购买情侣款，戴出甜蜜感'],
    reason: '一块经典的手表，是时间的见证，也是品味的象征。DW以简约北欧设计著称，轻薄表盘搭配尼龙或皮质表带，通勤、休闲都能驾驭。每一次看时间，都会想起送表的你——"我的时间，从此有了你。"',
    packaging: {
      ideas: ['原装表盒外再包一层质感包装纸，系上丝带', '在表盒内放一张拍立得照片，记录你们的美好瞬间', '搭配一瓶TA喜欢的香水，组成"时间+味道"的记忆组合'],
      wishes: ['愿往后的每一分每一秒，都有我陪你度过。', '时间会走，但我对你的心意，永远停在最爱你的那一刻。']
    },
    platforms: [
      { name: 'DW官网', price: 1290, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1190, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1250, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_003',
    name: '定制款情侣银饰项链/手链',
    category: 'jewelry',
    basePrice: 520,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['jewelry', 'accessories', 'fashion'],
    scores: { practical: 60, emotional: 95, unique: 90, budgetMatch: 0 },
    scenarios: ['日常佩戴：低调百搭，随时想起彼此', '纪念日礼物：刻上重要日期，专属纪念', '情侣约会：戴着同款出街，甜蜜满分', '告白求婚：用定制首饰说出心意'],
    reason: '情侣银饰是最浪漫的信物。可以刻上彼此的名字、纪念日，或是只有你们懂的暗号。925银不过敏，款式简约百搭，日常也能佩戴。每当TA低头看到首饰，就像你在身边一样，这份心意，随时都在。',
    packaging: {
      ideas: ['用丝绒首饰盒包装，放上干花点缀', '手写一封情书，和首饰一起放在礼盒里', '搭配一小束满天星，浪漫加倍'],
      wishes: ['愿我们的爱情，像这银饰一样，历经岁月依然闪亮。', '你是我独一无二的宝贝，就像这专属定制的礼物。']
    },
    platforms: [
      { name: '淘宝定制店', price: 520, badge: '可定制', url: '' },
      { name: '天猫珠宝店', price: 599, badge: '品质保证', url: '' },
      { name: '京东珠宝', price: 568, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_004',
    name: 'SK-II 神仙水精华护肤套装',
    category: 'cosmetics',
    basePrice: 1590,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['cosmetics', 'beauty', 'skincare'],
    scores: { practical: 88, emotional: 80, unique: 65, budgetMatch: 0 },
    scenarios: ['生日礼物：送给爱美的她，实用又贴心', '节日惊喜：情人节、520表达爱意', '日常护肤：每天用都会想起你的好', '犒劳自己：她辛苦了，送份护肤品让她好好爱自己'],
    reason: 'SK-II神仙水是护肤界的经典，90%以上的PITERA精华，改善肤质、提亮肤色。一套包含神仙水、面霜、洁面，是完整的护肤体验。送她这份礼物，是告诉她："你值得最好的呵护，就像我对你的爱一样，用心滋养。"',
    packaging: {
      ideas: ['专柜礼盒包装，系上粉色丝带', '搭配一张SPA体验券，让她从头到脚放松', '放入一张手写卡片，告诉她"你在我心中永远最美"'],
      wishes: ['愿你永远美丽动人，就像我们的爱情一样，越来越有光彩。', '你的美丽，值得用最好的来呵护；你的好，值得我用一生来珍藏。']
    },
    platforms: [
      { name: 'SK-II官网', price: 1590, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1490, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1550, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_005',
    name: 'iPad mini 6 平板电脑',
    category: 'electronics',
    basePrice: 3799,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 90, emotional: 72, unique: 68, budgetMatch: 0 },
    scenarios: ['通勤路上：看剧、阅读，打发碎片时间', '工作学习：记笔记、查资料，生产力工具', '休闲娱乐：追剧、打游戏、刷视频', '创意创作：画画、修图，激发灵感'],
    reason: 'iPad mini 6 小巧便携，功能强大。8.3英寸全面屏，A15芯片，性能强劲又方便随身携带。无论是通勤路上看剧，还是工作中记笔记，或是休闲时打游戏，都能胜任。送TA这份礼物，就是送TA一个随身的娱乐与生产力伙伴。',
    packaging: {
      ideas: ['原装包装盒外加一个定制礼袋', '搭配一个好看的保护套和触控笔', '在里面放一张小卡片，写着"愿你的生活，像这块屏幕一样精彩"'],
      wishes: ['愿你的生活丰富多彩，每一天都有新的惊喜。', '这是我送你的"小天地"，在里面可以做你喜欢的一切。']
    },
    platforms: [
      { name: 'Apple官网', price: 3799, badge: '正品保障', url: '' },
      { name: '京东自营', price: 3699, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3749, badge: '分期免息', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_006',
    name: '戴森 Dyson Airwrap 美发造型器',
    category: 'beauty',
    basePrice: 3690,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 85, emotional: 88, unique: 80, budgetMatch: 0 },
    scenarios: ['日常造型：在家轻松做出沙龙级发型', '约会前：美美的发型，约会更自信', '出差旅行：一机多用，不用带一堆工具', '犒劳自己：她值得拥有最好的'],
    reason: '戴森Airwrap是每个女生都想要的美发神器。利用康达效应，不需要过高温度就能造型，减少热损伤。卷发、直发、吹发一机搞定，手残党也能轻松上手。送她这份礼物，就是告诉她："你值得每天都美美的，就像你在我心里一样。"',
    packaging: {
      ideas: ['戴森原装礼盒包装，高端大气', '搭配一套护发精油和发膜，呵护头发', '附上一张手写卡片："为你做头发的样子，是我见过最美的风景"'],
      wishes: ['愿你每天都能美美的，心情也像发型一样精致。', '你的美，值得用最好的来衬托；你的好，值得我用一生去守护。']
    },
    platforms: [
      { name: '戴森官网', price: 3690, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 3590, badge: '官方授权', url: '' },
      { name: '京东自营', price: 3650, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_007',
    name: 'LAMY 凌美狩猎者钢笔礼盒',
    category: 'stationery',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['stationery', 'reading', 'creative'],
    scores: { practical: 75, emotional: 78, unique: 72, budgetMatch: 0 },
    scenarios: ['工作办公：签字、记笔记，提升专业感', '学习深造：学生党写作业、记笔记', '手账书写：写手账、日记，记录生活', '收藏爱好：钢笔爱好者的入门之选'],
    reason: 'LAMY狩猎者系列是钢笔界的经典，德系品质，书写流畅。ABS笔身轻巧耐用，握感舒适。礼盒包装，配上墨水和替换笔尖，实用又有仪式感。送TA一支好笔，愿TA写出精彩人生，而你，就是TA人生中最美的篇章。',
    packaging: {
      ideas: ['原装礼盒包装，配上一瓶彩色墨水', '在笔身上刻上TA的名字或重要日期', '搭配一本好看的笔记本，组成"笔+本"套装'],
      wishes: ['愿你用这支笔，写出属于我们的美好故事。', '每一笔都是心意，每一个字都是我对你的思念。']
    },
    platforms: [
      { name: 'LAMY官网', price: 399, badge: '正品保障', url: '' },
      { name: '京东自营', price: 369, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 389, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_008',
    name: '无印良品 MUJI 超声波香薰机 + 精油套装',
    category: 'home',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['home', 'lifestyle', 'quality-life'],
    scores: { practical: 78, emotional: 82, unique: 70, budgetMatch: 0 },
    scenarios: ['睡前助眠：薰衣草精油帮助放松入眠', '工作学习：柠檬或迷迭香提神醒脑', '居家放松：周末在家享受香氛SPA', '营造氛围：约会时制造浪漫气氛'],
    reason: 'MUJI的香薰机简约百搭，放在家里任何角落都好看。超声波技术安静加湿，配上不同精油，能营造不同氛围。送TA这份礼物，就是给TA的生活增添一份仪式感——回到家，闻到喜欢的味道，一天的疲惫都消散了。',
    packaging: {
      ideas: ['用MUJI风的简约礼盒包装', '搭配3-5种不同功效的精油', '附上一张手写卡片："愿你每天都有好心情的味道"'],
      wishes: ['愿你的生活，有香气为伴，有我为你守候。', '每一种香味都是一种心情，而你是我最美的心情。']
    },
    platforms: [
      { name: 'MUJI官网', price: 399, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 379, badge: '官方授权', url: '' },
      { name: '京东自营', price: 389, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_009',
    name: '富士 Instax Mini 12 拍立得相机',
    category: 'photography',
    basePrice: 699,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['photography', 'creativity', 'lifestyle'],
    scores: { practical: 65, emotional: 90, unique: 82, budgetMatch: 0 },
    scenarios: ['情侣约会：随时拍下甜蜜瞬间', '朋友聚会：派对上拍出立拍立得的快乐', '旅行出游：记录旅途风景和心情', '家居装饰：把照片贴满墙，都是回忆'],
    reason: '拍立得是记录美好的最佳方式。按下快门，照片立刻出来，那种期待影像慢慢显现的感觉，是数码照片给不了的。Mini 12颜值高、操作简单，随手一拍都是ins风。送TA这份礼物，就是想和TA一起，把每一个美好瞬间都变成实体的回忆。',
    packaging: {
      ideas: ['配上几盒相纸（白边、彩虹边、卡通边）', '搭配一个可爱的相机包和相册', '在礼盒里放一张你拍的TA的照片，写上祝福语'],
      wishes: ['愿我们一起拍下更多美好的瞬间，攒满一本又一本相册。', '每一张照片都是我们的故事，而故事还在继续。']
    },
    platforms: [
      { name: '富士官网', price: 699, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 649, badge: '官方授权', url: '' },
      { name: '京东自营', price: 679, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_010',
    name: '乐高 LEGO 经典建筑/IDEAS系列',
    category: 'diy',
    basePrice: 599,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['diy', 'handmade', 'creative'],
    scores: { practical: 55, emotional: 82, unique: 85, budgetMatch: 0 },
    scenarios: ['情侣互动：一起拼乐高，享受协作时光', '减压放松：专注拼搭，忘记工作烦恼', '家居装饰：拼好后当摆件，好看又有意义', '收藏爱好：乐高爱好者的收藏之选'],
    reason: '乐高不只是玩具，更是一种生活方式。选择建筑或IDEAS系列，既有挑战性，拼好后又很有成就感。两个人一起拼，边拼边聊，几个小时的时光一下就过去了。送TA这份礼物，就是想和TA一起创造属于你们的"积木时光"。',
    packaging: {
      ideas: ['用大号礼盒包装，配上LED灯串', '搭配一个展示盒，拼好后可以展示', '写一张小卡片："愿我们像乐高一样，一块一块拼出幸福"'],
      wishes: ['愿我们的爱情，像乐高一样，一块一块，越拼越完整。', '和你在一起的每一刻，都像拼乐高一样，充满期待和惊喜。']
    },
    platforms: [
      { name: '乐高官网', price: 599, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 549, badge: '官方授权', url: '' },
      { name: '京东自营', price: 579, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_011',
    name: '祖玛珑 Jo Malone 香水礼盒',
    category: 'perfume',
    basePrice: 1280,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['perfume', 'beauty', 'fashion'],
    scores: { practical: 70, emotional: 90, unique: 78, budgetMatch: 0 },
    scenarios: ['日常使用：每天喷一喷，好心情从香味开始', '约会必备：专属味道，增加魅力值', '重要场合：面试、聚会，留香得体', '收藏爱好：香水爱好者的入门之选'],
    reason: '祖玛珑的香水以清新淡雅著称，英国梨与小苍兰、蓝风铃、鼠尾草与海盐都是经典。礼盒装可以一次拥有多款，还能叠喷创造专属香味。送TA香水，是送给TA一种专属的记忆——闻到这个味道，就会想起你。',
    packaging: {
      ideas: ['祖玛珑原装礼盒，系上经典蝴蝶结', '搭配一个同款香型的身体乳', '写一张小卡片："这是我为你选的味道，就像你在我心里一样特别"'],
      wishes: ['愿你身上的味道，是我专属的记忆符号。', '闻香识你，这是我刻在心里的名字。']
    },
    platforms: [
      { name: '祖玛珑官网', price: 1280, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1180, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1250, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_012',
    name: 'Bose SoundLink Flex 便携蓝牙音箱',
    category: 'electronics',
    basePrice: 1099,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 82, emotional: 72, unique: 68, budgetMatch: 0 },
    scenarios: ['户外野餐：带着音乐去郊游', '居家休闲：洗澡、做饭都有音乐陪伴', '朋友聚会：随时开启派对模式', '运动健身：防水防汗，运动时也能用'],
    reason: 'Bose的音质没得说，这款便携音箱小巧轻便，却能发出震撼的声音。IP67防水防尘，户外使用也不怕。挂扣设计可以挂在背包上，走到哪带到哪。送TA这份礼物，就是让音乐随时随地陪伴TA，就像你的爱一样，无处不在。',
    packaging: {
      ideas: ['用质感礼盒包装，配上一个便携收纳包', '搭配一张音乐会员年卡', '写一张小卡片："愿音乐和我，都能给你带来快乐"'],
      wishes: ['愿你的生活，有音乐为伴，也有我为你唱歌。', '每一个音符都是我对你的思念，愿你听到的每首歌都是甜的。']
    },
    platforms: [
      { name: 'Bose官网', price: 1099, badge: '正品保障', url: '' },
      { name: '京东自营', price: 999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1059, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_013',
    name: '网易云音乐 / QQ音乐 年度黑胶会员',
    category: 'electronics',
    basePrice: 188,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 88, emotional: 65, unique: 50, budgetMatch: 0 },
    scenarios: ['日常听歌：无损音质，想听就听', '通勤路上：音乐陪伴，路途不无聊', '工作学习：背景音乐，提高效率', '运动健身：动感音乐，运动更带劲'],
    reason: '音乐会员是实用又贴心的小礼物。无损音质、付费歌曲、独家内容，一年的音乐自由。虽然不贵，但每天都能用得上。送TA这份礼物，就是告诉TA："你的每一首歌，我都想陪你听。"',
    packaging: {
      ideas: ['做一张精美的"音乐兑换券"卡片', '搭配一个你精选的歌单（打印出来）', '在卡片上写："这一年的音乐，我包了"'],
      wishes: ['愿你每天都有好听的歌，也有想见的人。', '想和你一起听很多很多歌，走很长很长的路。']
    },
    platforms: [
      { name: '网易云音乐', price: 158, badge: '年度会员', url: '' },
      { name: 'QQ音乐', price: 188, badge: '绿钻豪华版', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_014',
    name: '马克杯定制(印照片/名字/语录)',
    category: 'diy',
    basePrice: 128,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['diy', 'handmade', 'creative'],
    scores: { practical: 85, emotional: 88, unique: 75, budgetMatch: 0 },
    scenarios: ['日常使用：每天喝水都能想起你', '办公陪伴：在公司用，同事都羡慕', '情侣配对：情侣款马克杯，甜蜜加倍', '节日小礼：圣诞节、情人节的小惊喜'],
    reason: '定制马克杯是性价比超高的礼物。印上你们的合照、TA的名字，或是一句只有你们懂的话。每天喝水的时候，看到杯子就想起你。一杯子，一辈子——虽然俗套，但真心。送TA这个杯子，就是想和TA一起，喝很多很多杯水，走很长很长的路。',
    packaging: {
      ideas: ['用泡沫盒安全包装，外裹一层彩纸', '搭配一盒TA喜欢的茶叶或咖啡', '写一张小卡片："一杯子，一辈子"'],
      wishes: ['愿我们的爱情，像这杯子一样，一辈子都暖。', '每天喝水的时候，都要想起我哦。']
    },
    platforms: [
      { name: '淘宝定制', price: 128, badge: '可定制', url: '' },
      { name: '京东定制', price: 158, badge: '快速发货', url: '' },
      { name: '网易严选', price: 99, badge: '品质保证', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_015',
    name: '野兽派 / 花点时间 月度鲜花订阅',
    category: 'flowers',
    basePrice: 299,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['flowers', 'romantic', 'lifestyle'],
    scores: { practical: 60, emotional: 95, unique: 85, budgetMatch: 0 },
    scenarios: ['日常惊喜：每周一束花，好心情一整月', '办公室装饰：让TA的工位美美哒', '居家美化：家里有花，生活有仪式感', '表达爱意：用鲜花说"我爱你"'],
    reason: '谁说鲜花只能送一次？月度鲜花订阅，让TA一个月里每周都能收到鲜花，每次都是惊喜。野兽派或花点时间的花材新鲜、搭配好看。送TA这份礼物，就是让TA的一整个月，都有鲜花和你的爱陪伴。',
    packaging: {
      ideas: ['选择礼盒装配送，每次都有拆礼物的感觉', '第一束花里附上一张手写卡片', '可以选"每周一花"或"隔周一花"的套餐'],
      wishes: ['愿你的生活，像鲜花一样，永远灿烂绽放。', '每周都有花，每天都想你。这是我给你的浪漫。']
    },
    platforms: [
      { name: '野兽派', price: 399, badge: '高端品质', url: '' },
      { name: '花点时间', price: 299, badge: '性价比高', url: '' },
      { name: '花加', price: 259, badge: '款式多样', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_016',
    name: '精心手工DIY礼物(拼贴画/手账本/针织围巾)',
    category: 'diy',
    basePrice: 99,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['diy', 'handmade', 'creative'],
    scores: { practical: 50, emotional: 98, unique: 95, budgetMatch: 0 },
    scenarios: ['生日礼物：亲手做的，才是最珍贵的', '纪念日惊喜：用手账记录你们的故事', '冬天送温暖：亲手织的围巾，暖暖的都是爱', '告白神器：把心意都做进礼物里'],
    reason: '手工礼物的珍贵，在于投入的时间和心意。拼贴画记录你们的回忆，手账本写下你们的故事，针织围巾每一针都是爱。虽然不贵重，但每一样都是独一无二的——因为是你做的，所以TA才会珍藏一辈子。',
    packaging: {
      ideas: ['用好看的包装纸精心包裹', '附上一封手写信，说出你的心意', '可以在礼物上缝上或贴上你们的纪念日'],
      wishes: ['这礼物虽然不贵，但每一寸都是我的心意。', '我把对你的爱，一针一线、一字一句，都做进了这份礼物里。']
    },
    platforms: [
      { name: '淘宝材料包', price: 99, badge: 'DIY套装', url: '' },
      { name: '拼多多', price: 69, badge: '价格实惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_017',
    name: '书籍套装(TA感兴趣领域的好书)',
    category: 'book',
    basePrice: 268,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['book', 'reading', 'self-improvement'],
    scores: { practical: 80, emotional: 75, unique: 70, budgetMatch: 0 },
    scenarios: ['日常阅读：睡前、通勤，充实自己', '学习提升：专业领域的经典书籍', '心灵成长：治愈系、成长类书籍', '共同爱好：你们都喜欢的作家或类型'],
    reason: '书籍是性价比最高的礼物。选TA感兴趣领域的好书，3-5本一套，既实用又有内涵。每本书的扉页都写一句你的寄语，TA在阅读时，不仅能获得知识，还能感受到你的用心。送书，是送TA一个更大的世界。',
    packaging: {
      ideas: ['用牛皮纸包书，系上棉绳，文艺感满分', '每本书的扉页都写一句不同的话', '搭配一个书签（可以是定制的）'],
      wishes: ['愿你在书里，找到更大的世界；也在我身边，找到最暖的港湾。', '读过的书会融进骨子里，而我对你的爱，会刻在心里。']
    },
    platforms: [
      { name: '当当网', price: 268, badge: '正版图书', url: '' },
      { name: '京东图书', price: 258, badge: '次日达', url: '' },
      { name: '淘宝书店', price: 238, badge: '价格优惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_018',
    name: '电影/演出/展览门票 + 约会套餐',
    category: 'experience',
    basePrice: 388,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['experience', 'date', 'memory'],
    scores: { practical: 55, emotional: 95, unique: 90, budgetMatch: 0 },
    scenarios: ['情侣约会：精心策划的约会，浪漫满分', '生日礼物：用一场演出生日会代替蛋糕', '纪念日：看一场关于爱情的电影或展览', '兴趣爱好：TA喜欢的乐队/歌手的演唱会'],
    reason: '最好的礼物不是物品，而是共同的回忆。选一场TA想看的电影、演出或展览，再安排一顿好吃的晚餐，一次完美的约会就搞定了。送TA这份礼物，就是告诉TA："我想和你一起创造更多美好的回忆。"',
    packaging: {
      ideas: ['把门票装在精美的信封里，附上约会行程单', '可以做一张"约会兑换券"，让TA自己选时间', '搭配一束鲜花，在约会开始时送给TA'],
      wishes: ['愿我们一起看很多场电影，听很多场演唱会，走很长的人生。', '和你在一起的每一天，都是最好的礼物。']
    },
    platforms: [
      { name: '大麦网', price: 388, badge: '正规票务', url: '' },
      { name: '猫眼电影', price: 199, badge: '电影票', url: '' },
      { name: '摩天轮', price: 358, badge: '演出票务', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_019',
    name: '智能手环/运动手表(小米/华为)',
    category: 'electronics',
    basePrice: 299,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 88, emotional: 70, unique: 60, budgetMatch: 0 },
    scenarios: ['运动健身：记录步数、心率、运动数据', '健康监测：睡眠监测、压力监测、血氧', '日常通勤：消息提醒、看时间，不用掏手机', '情侣互动：步数PK、健康数据分享'],
    reason: '智能手环是实用又贴心的健康礼物。小米、华为的手环性价比高，功能齐全——计步、心率、睡眠、血氧、消息提醒一应俱全。送TA这份礼物，就是关心TA的健康，告诉TA："你的健康，对我来说最重要。"',
    packaging: {
      ideas: ['原装盒外加一个精美礼袋', '搭配一个替换表带（不同颜色/材质）', '写一张小卡片："愿你每天都健健康康，陪我走很久很久"'],
      wishes: ['愿你身体健康，心情美丽，我们一起走很长的路。', '你的每一步，我都想参与；你的每一天，我都想陪伴。']
    },
    platforms: [
      { name: '小米官网', price: 299, badge: '正品保障', url: '' },
      { name: '华为商城', price: 399, badge: '正品保障', url: '' },
      { name: '京东自营', price: 279, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_020',
    name: '香薰蜡烛礼盒(Voluspa / Paddywax)',
    category: 'home',
    basePrice: 368,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['home', 'lifestyle', 'quality-life'],
    scores: { practical: 65, emotional: 88, unique: 80, budgetMatch: 0 },
    scenarios: ['睡前放松：点上蜡烛，洗个热水澡，一天的疲惫都没了', '周末居家：看书、听音乐，蜡烛营造氛围', '约会之夜：烛光晚餐+香薰，浪漫加倍', '泡澡时光：泡澡时点上，在家享受SPA'],
    reason: '香薰蜡烛是提升生活幸福感的小物。Voluspa和Paddywax都是美国的香薰品牌，颜值高、香味好闻。礼盒装多种香味，可以慢慢尝试。送TA这份礼物，就是给TA的生活增添一份仪式感和温暖。',
    packaging: {
      ideas: ['用丝带绑好蜡烛，配上一盒火柴', '搭配一个好看的烛台', '写一张小卡片："愿你的生活，有光有香有爱"'],
      wishes: ['愿你的生活，像这蜡烛一样，温暖而有光。', '点上蜡烛的那一刻，就像我在你身边一样温暖。']
    },
    platforms: [
      { name: 'Voluspa官网', price: 368, badge: '正品保障', url: '' },
      { name: '天猫国际', price: 328, badge: '海外直邮', url: '' },
      { name: '京东国际', price: 348, badge: '快速到货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_021',
    name: 'Kindle Paperwhite 电子书阅读器',
    category: 'electronics',
    basePrice: 1099,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 85, emotional: 72, unique: 68, budgetMatch: 0 },
    scenarios: ['通勤阅读：地铁、公交上看书，不伤眼', '睡前阅读：墨水屏，不影响睡眠', '旅行便携：几千本书装进口袋', '学习提升：读专业书、英文书都方便'],
    reason: 'Kindle是爱书人的必备神器。Paperwhite系列墨水屏护眼，防水设计，洗澡泡澡都能看。机身轻便，揣兜里就走，几千本书随身携带。送TA这份礼物，就是送TA一座移动的图书馆，愿TA在书里找到更大的世界。',
    packaging: {
      ideas: ['搭配一个好看的保护套（可以定制）', '附赠几本书的兑换券', '写一张小卡片："愿你读过的书，都成为你脚下的路"'],
      wishes: ['愿你在书里遇见更好的自己，也在我身边遇见最真的爱情。', '读书和爱你，都是我想坚持一辈子的事。']
    },
    platforms: [
      { name: '亚马逊中国', price: 1099, badge: '正品保障', url: '' },
      { name: '京东自营', price: 999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1059, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_022',
    name: 'Nintendo Switch OLED 主机',
    category: 'gaming',
    basePrice: 2599,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 70, emotional: 90, unique: 80, budgetMatch: 0 },
    scenarios: ['情侣互动：一起玩《动森》《马里奥派对》', '居家娱乐：周末宅家打游戏，快乐加倍', '便携出游：拆下来随身携带，旅行不无聊', '运动健身：《健身环大冒险》边玩边瘦'],
    reason: 'Switch是能让两个人都快乐的神器。OLED屏幕色彩鲜艳，可掌机可主机。买了Switch，再买几款情侣游戏，周末宅家打游戏，感情迅速升温。送TA这份礼物，就是想和TA一起，玩很多很多游戏，创造很多很多快乐回忆。',
    packaging: {
      ideas: ['搭配1-2款情侣游戏（动森、马里奥派对等）', '配上好看的收纳包和保护膜', '写一张小卡片："愿我们一起打怪升级，从游戏到人生"'],
      wishes: ['愿我们像玩游戏一样，一起打怪升级，永远是队友。', '想和你玩一辈子的游戏，也想和你过一辈子的日子。']
    },
    platforms: [
      { name: '任天堂官网', price: 2599, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2499, badge: '次日达', url: '' },
      { name: '天猫国际', price: 2399, badge: '海外直邮', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_023',
    name: 'Sony PlayStation 5 主机',
    category: 'gaming',
    basePrice: 3899,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 72, emotional: 92, unique: 78, budgetMatch: 0 },
    scenarios: ['游戏体验：3A大作，次世代游戏体验', '情侣互动：双人成行、麻布仔大冒险', '影音娱乐：4K蓝光播放，家庭影院', '收藏爱好：游戏爱好者的梦想之选'],
    reason: 'PS5是每个游戏男孩的梦想。次世代主机，性能强劲，游戏体验拉满。如果你也愿意陪TA玩，那更是加分项——《双人成行》《麻布仔》都是很棒的情侣游戏。送TA这份礼物，就是告诉TA："你的爱好，我都支持；你的快乐，就是我的快乐。"',
    packaging: {
      ideas: ['搭配1-2款TA心仪已久的游戏', '配上一个额外的手柄（双人游戏用）', '写一张小卡片："愿你在游戏里畅快，在生活里也畅快"'],
      wishes: ['愿你永远保有对游戏的热爱，也永远保有对生活的热情。', '你打游戏的样子很帅，但你转身对我笑的样子更帅。']
    },
    platforms: [
      { name: '索尼官网', price: 3899, badge: '正品保障', url: '' },
      { name: '京东自营', price: 3799, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3849, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_024',
    name: 'Steam Deck 掌上游戏机',
    category: 'gaming',
    basePrice: 3499,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'music', 'gaming'],
    scores: { practical: 75, emotional: 88, unique: 82, budgetMatch: 0 },
    scenarios: ['通勤路上：地铁上也能玩3A大作', '出差旅行：随身携带，旅途不无聊', '居家休闲：窝在沙发上玩游戏', 'PC玩家：Steam库的游戏随身带'],
    reason: 'Steam Deck是PC游戏玩家的福音。Valve出品，能玩Steam库里的几千款游戏，性能强劲。掌机大小，随时随地都能玩。如果TA是个PC游戏爱好者，送这个绝对没错。这不仅是礼物，更是懂TA的证明。',
    packaging: {
      ideas: ['搭配一个便携收纳包和保护膜', '送一款TA心仪的Steam游戏（兑换码）', '写一张小卡片："愿你走到哪，快乐就跟到哪"'],
      wishes: ['愿你的生活，像游戏一样精彩；愿你的快乐，随时随地都在。', '你喜欢的，我都记得；你想要的，我都愿意给。']
    },
    platforms: [
      { name: 'Steam官网', price: 3499, badge: '正品保障', url: '' },
      { name: '京东国际', price: 3699, badge: '快速到货', url: '' },
      { name: '淘宝代购', price: 3299, badge: '价格实惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_025',
    name: 'Casio 卡西欧 G-SHock 电子运动手表',
    category: 'watch',
    basePrice: 890,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 88, emotional: 72, unique: 68, budgetMatch: 0 },
    scenarios: ['运动健身：防水防震，运动时也能戴', '日常通勤：百搭款式，配休闲装超帅', '户外探险：耐用抗造，户外爱好者必备', '学生时代：学生党最爱的手表之一'],
    reason: 'G-SHOCK是男人的浪漫。强悍耐用，防水防震，功能丰富。经典款不过时，戴几年都没问题。送他一块G-SHOCK，就像送他一个靠谱的伙伴——经得住摔打，陪得住时光。',
    packaging: {
      ideas: ['原装表盒外加一个精美礼袋', '搭配一个运动手环或运动配件', '写一张小卡片："愿你像G-SHOCK一样，永远强悍，永远年轻"'],
      wishes: ['愿你永远年轻，永远热血，永远有我陪伴。', '时间会走，但我对你的爱，像G-SHOCK一样，经得起任何考验。']
    },
    platforms: [
      { name: '卡西欧官网', price: 890, badge: '正品保障', url: '' },
      { name: '京东自营', price: 790, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 850, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_026',
    name: '华为 WATCH GT 4 智能手表',
    category: 'watch',
    basePrice: 1588,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 90, emotional: 75, unique: 65, budgetMatch: 0 },
    scenarios: ['运动健身：100+运动模式，精准监测', '健康管理：心率、血氧、睡眠、压力监测', '商务办公：消息提醒、接打电话，不用掏手机', '日常穿搭：时尚外观，搭配各种风格'],
    reason: '华为WATCH GT 4是颜值与实力并存的智能手表。两周长续航，不用天天充电。健康监测功能全面，运动模式丰富。外观时尚，商务休闲都能搭。送TA这份礼物，就是把关心戴在TA手上——你的健康，我时刻关注。',
    packaging: {
      ideas: ['原装表盒外加一个精美礼袋', '搭配一个替换表带（皮表带/运动表带）', '写一张小卡片："愿你的每一天，都健康、快乐、有我"'],
      wishes: ['愿你身体健康，工作顺利，我们的爱情长长久久。', '每一次心跳，都是我在想你。这块表，替我守护你的健康。']
    },
    platforms: [
      { name: '华为商城', price: 1588, badge: '正品保障', url: '' },
      { name: '京东自营', price: 1488, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1548, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_027',
    name: 'Tissot 天梭 力洛克机械表',
    category: 'watch',
    basePrice: 3200,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 82, emotional: 88, unique: 75, budgetMatch: 0 },
    scenarios: ['商务场合：机械表提升气质，专业可靠', '日常通勤：百搭款式，每天都能戴', '重要时刻：生日、升职、纪念日的礼物', '收藏入门：瑞士机械表的入门之选'],
    reason: '天梭力洛克是经典的入门级瑞士机械表。ETA机芯，走时精准，蓝宝石玻璃表镜，耐用。设计简约大气，商务休闲都能搭。送他一块机械表，是对他品味的认可，也是对你们未来的期许——"愿我们的爱情，像机械表一样，经得起时间的考验。"',
    packaging: {
      ideas: ['原装表盒外加一层精致包装', '搭配一条皮质表带（替换用）', '写一张小卡片："时间会证明一切，包括我对你的爱"'],
      wishes: ['愿我们的爱情，像机械表一样，精准而持久。', '时间在走，世界在变，但我对你的爱，永远不变。']
    },
    platforms: [
      { name: '天梭官网', price: 3200, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3100, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_028',
    name: 'Emporio Armani 阿玛尼 满天星女士手表',
    category: 'watch',
    basePrice: 2990,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 75, emotional: 92, unique: 82, budgetMatch: 0 },
    scenarios: ['日常通勤：好看又实用，每天都想戴', '约会出门：搭配美美的衣服，自信加分', '重要场合：派对、聚会，闪耀全场', '生日礼物：女生都爱的满天星'],
    reason: '阿玛尼满天星是女生都无法拒绝的手表。水钻镶嵌的表盘，像满天繁星一样闪耀。简约大气的设计，搭配什么风格都好看。送她这块表，就是告诉她："你是我心中最亮的星，也是我想珍藏一辈子的宝贝。"',
    packaging: {
      ideas: ['原装表盒外加一个精美礼盒', '搭配一条同品牌的项链或手链', '写一张小卡片："你是我心中最亮的星"'],
      wishes: ['愿你像满天星一样，永远闪耀，永远被爱。', '你是我眼中的星辰大海，是我想守护的光。']
    },
    platforms: [
      { name: '阿玛尼官网', price: 2990, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 2790, badge: '官方授权', url: '' },
      { name: '京东自营', price: 2890, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_029',
    name: 'Swarovski 施华洛世奇 天鹅项链',
    category: 'jewelry',
    basePrice: 1290,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['jewelry', 'accessories', 'fashion'],
    scores: { practical: 70, emotional: 92, unique: 78, budgetMatch: 0 },
    scenarios: ['日常佩戴：低调精致，每天都能戴', '约会出门：戴上它，美美地去见你', '重要场合：派对、聚会，闪耀动人', '生日礼物：经典款永远不会错'],
    reason: '施华洛世奇的天鹅项链是经典中的经典。天鹅象征着忠贞的爱情，水晶闪耀夺目。设计简约大方，搭配什么衣服都好看。送她这条项链，就是告诉她："你像天鹅一样优雅美丽，而我对你的爱，忠贞不渝。"',
    packaging: {
      ideas: ['原装首饰盒外加一个精美礼袋', '搭配一束鲜花（玫瑰或满天星）', '写一张小卡片："你是我心中最美的天鹅"'],
      wishes: ['愿你像天鹅一样优雅，像水晶一样闪耀。', '你是我的唯一，是我想珍藏一辈子的宝贝。']
    },
    platforms: [
      { name: '施华洛世奇官网', price: 1290, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1190, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1250, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_030',
    name: '周大福 传承系列 古法黄金手镯',
    category: 'jewelry',
    basePrice: 4500,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['jewelry', 'accessories', 'fashion'],
    scores: { practical: 78, emotional: 95, unique: 88, budgetMatch: 0 },
    scenarios: ['定情信物：黄金手镯，传情达意', '婚嫁首饰：三金/五金必备', '日常佩戴：古法工艺，低调有质感', '投资收藏：黄金保值，越戴越值钱'],
    reason: '周大福传承系列的古法黄金手镯，既有传统韵味，又时尚百搭。古法工艺，哑光质感，不像普通黄金那么俗气。送她黄金手镯，是最实在的爱意——不仅好看，还保值。更重要的是，你愿意把最好的给她。',
    packaging: {
      ideas: ['周大福原装首饰盒，高端大气', '搭配一束红玫瑰，喜庆浪漫', '写一张小卡片："愿我们的爱情，像黄金一样，经得起时间的考验，越久越珍贵"'],
      wishes: ['愿我们的爱情，像黄金一样，越久越珍贵。', '你是我最珍贵的宝贝，值得用所有的美好来呵护。']
    },
    platforms: [
      { name: '周大福官网', price: 4500, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 4300, badge: '官方授权', url: '' },
      { name: '京东自营', price: 4400, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_031',
    name: 'APM Monaco 星星耳钉',
    category: 'jewelry',
    basePrice: 780,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['jewelry', 'accessories', 'fashion'],
    scores: { practical: 78, emotional: 88, unique: 80, budgetMatch: 0 },
    scenarios: ['日常佩戴：小巧精致，通勤也能戴', '约会出门：闪亮的星星，约会更动人', '礼物首选：不会出错的精致小礼物', '叠戴搭配：可以和其他耳钉一起戴'],
    reason: 'APM的星星耳钉是很多女生的心头好。来自摩纳哥的小众品牌，设计时尚有格调。六芒星设计经典百搭，戴上耳朵很精致。送她这对耳钉，就是告诉她："你是我的小星星，照亮我的每一天。"',
    packaging: {
      ideas: ['原装首饰盒，系上丝带', '搭配一个同系列的项链或手链', '写一张小卡片："你是我的小星星，闪耀在我心里"'],
      wishes: ['愿你像星星一样，永远闪耀，永远被爱。', '你是我眼里的光，是我心里的星。']
    },
    platforms: [
      { name: 'APM官网', price: 780, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 680, badge: '官方授权', url: '' },
      { name: '京东自营', price: 750, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_032',
    name: '兰蔻 小黑瓶 肌底精华液',
    category: 'cosmetics',
    basePrice: 1080,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['cosmetics', 'beauty', 'skincare'],
    scores: { practical: 90, emotional: 82, unique: 68, budgetMatch: 0 },
    scenarios: ['日常护肤：每天用，肌肤越来越好', '生日礼物：实用又贴心的护肤品', '节日惊喜：情人节、520送她美丽', '犒劳自己：她辛苦了，要好好护肤'],
    reason: '兰蔻小黑瓶是精华界的扛把子。微生态护肤，修护肌底，让肌肤更稳定、更透亮。一瓶可以用很久，每天早晚都能用。送她这份礼物，就是告诉她："你值得最好的呵护，你的美丽，由我来守护。"',
    packaging: {
      ideas: ['兰蔻专柜礼盒包装，配上丝带', '搭配一瓶同款眼霜或面霜', '写一张小卡片："愿你永远年轻美丽"'],
      wishes: ['愿你永远美丽，永远年轻，永远是我心中的女神。', '你的美，值得用最好的来呵护；你的好，值得我用一生来珍藏。']
    },
    platforms: [
      { name: '兰蔻官网', price: 1080, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 980, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1050, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_033',
    name: '雅诗兰黛 鲜亮焕活精华套装',
    category: 'cosmetics',
    basePrice: 1280,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['cosmetics', 'beauty', 'skincare'],
    scores: { practical: 88, emotional: 85, unique: 70, budgetMatch: 0 },
    scenarios: ['日常护肤：一套搞定，护肤更完整', '生日礼物：套装更有仪式感', '节日礼物：情人节、圣诞节都合适', '护肤升级：从基础到进阶的礼物'],
    reason: '雅诗兰黛的鲜亮焕活系列是抗初老的明星产品。套装包含精华、面霜、眼霜，一套搞定护肤流程。送她护肤套装，是最实在的关心——希望她好好照顾自己，永远美丽。她每天护肤的时候，都会想起你的好。',
    packaging: {
      ideas: ['雅诗兰黛专柜礼盒包装', '搭配一片面膜或小样套装', '写一张小卡片："愿你永远18岁"'],
      wishes: ['愿时光对你温柔以待，愿我对你的爱与日俱增。', '你在我心里，永远是最美的样子。']
    },
    platforms: [
      { name: '雅诗兰黛官网', price: 1280, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1180, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1250, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_034',
    name: 'YSL 圣罗兰 小金条口红礼盒',
    category: 'cosmetics',
    basePrice: 480,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['cosmetics', 'beauty', 'skincare'],
    scores: { practical: 82, emotional: 88, unique: 75, budgetMatch: 0 },
    scenarios: ['日常妆容：口红是女生的第二条命', '约会出门：美美的唇色，约会更自信', '生日礼物：口红永远不会嫌多', '节日小礼：情人节、520的甜蜜惊喜'],
    reason: 'YSL小金条是口红界的断货王。方管设计高级有质感，丝绒哑光质地，显色又不拔干。选热门色号（21、1966都不会错），她一定喜欢。送她口红，就是告诉她："你每一种样子，我都喜欢。"',
    packaging: {
      ideas: ['YSL专柜礼盒包装，配上丝带', '搭配一支同色系的唇釉或唇线笔', '写一张小卡片："你涂口红的样子，真好看"'],
      wishes: ['愿你永远有好看的口红，也永远有想见的人。', '你笑起来的样子，比口红还要鲜艳动人。']
    },
    platforms: [
      { name: 'YSL官网', price: 480, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 450, badge: '官方授权', url: '' },
      { name: '京东自营', price: 470, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_035',
    name: 'Dyson 戴森 Supersonic 吹风机',
    category: 'beauty',
    basePrice: 2990,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 92, emotional: 85, unique: 78, budgetMatch: 0 },
    scenarios: ['日常吹发：快速吹干，不伤发', '约会造型：出门前做个美美的造型', '居家必备：提升生活品质的神器', '礼物首选：每个女生都想要的吹风机'],
    reason: '戴森吹风机是提升生活幸福感的神器。高速马达，快速干发，智能温控，减少热损伤。用了戴森，才知道吹头发也可以是一种享受。送她这份礼物，就是告诉她："你的每一根头发，我都想好好呵护。"',
    packaging: {
      ideas: ['戴森原装礼盒包装，高端大气', '搭配一把气垫梳和护发精油', '写一张小卡片："愿你的每一天，都从一头美美的头发开始"'],
      wishes: ['愿你的生活，像戴森吹风机一样，高效、精致、有品质。', '你的美丽，从"头"开始；我的爱，从一而终。']
    },
    platforms: [
      { name: '戴森官网', price: 2990, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 2890, badge: '官方授权', url: '' },
      { name: '京东自营', price: 2950, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_036',
    name: 'JMW 角度卷发棒',
    category: 'beauty',
    basePrice: 1680,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 80, emotional: 82, unique: 75, budgetMatch: 0 },
    scenarios: ['日常造型：在家就能做出沙龙级卷发', '约会前：美美的卷发，约会更自信', '出差旅行：便携设计，带着也方便', '礼物首选：爱美的她一定会喜欢'],
    reason: 'JMW是韩国的专业美发品牌，角度卷发棒是它们家的明星产品。独特的角度设计，手残党也能轻松卷出好看的头发。送她这份礼物，就是让她每天都能美美的出门，而你，就是那个让她变美的人。',
    packaging: {
      ideas: ['用精美礼盒包装，配上隔热手套', '搭配一瓶护发精油和定型喷雾', '写一张小卡片："愿你每天都能美美的"'],
      wishes: ['愿你每天都有美美的发型，也有美美的心情。', '你美的样子，我都喜欢；你所有的样子，我都爱。']
    },
    platforms: [
      { name: 'JMW官网', price: 1680, badge: '正品保障', url: '' },
      { name: '天猫国际', price: 1580, badge: '海外直邮', url: '' },
      { name: '京东国际', price: 1650, badge: '快速到货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_037',
    name: 'Panasonic 松下 蒸脸器 纳米水离子美容仪',
    category: 'beauty',
    basePrice: 899,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 78, emotional: 80, unique: 72, budgetMatch: 0 },
    scenarios: ['晚间护肤：蒸脸打开毛孔，护肤品更好吸收', '周末放松：在家做SPA，享受护肤时光', '换季补水：皮肤干燥时的补水神器', '礼物首选：实用又贴心的护肤礼物'],
    reason: '松下的蒸脸器是护肤好帮手。纳米水离子能深入肌底，补水保湿。冷喷热喷都有，还能加香薰。晚上护肤前蒸一蒸，毛孔打开，护肤品吸收更好。送她这份礼物，就是送她一个居家美容院，让她好好爱自己。',
    packaging: {
      ideas: ['用精美礼盒包装，配上一盒面膜', '搭配一瓶保湿精华或化妆水', '写一张小卡片："愿你的皮肤永远水嫩，你的心情永远美丽"'],
      wishes: ['愿你的皮肤永远水嫩，你的笑容永远灿烂。', '你值得最好的呵护，也值得最深的爱。']
    },
    platforms: [
      { name: '松下官网', price: 899, badge: '正品保障', url: '' },
      { name: '京东自营', price: 799, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 859, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_038',
    name: 'Hobonavi 几乎手账 五年日记本',
    category: 'stationery',
    basePrice: 328,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['stationery', 'reading', 'creative'],
    scores: { practical: 72, emotional: 90, unique: 85, budgetMatch: 0 },
    scenarios: ['日记记录：每天写几句话，记录生活', '五年之约：五年后翻来看，满满都是回忆', '情侣互动：可以一人一本，互相分享', '礼物首选：有意义又文艺的礼物'],
    reason: '五年日记本是一件很浪漫的礼物。每天只写几句话，五年后同一天的记录都在同一页上。五年后翻来看，会发现时间过得好快，而你们的爱情，一直在成长。送TA这本日记，就是想和TA一起，记录五年的时光。',
    packaging: {
      ideas: ['配上一盒彩色笔和贴纸', '在第一页写一封给TA的信', '搭配一支好看的钢笔或中性笔'],
      wishes: ['愿我们一起写完一本又一本日记，走过一年又一年。', '五年很长，但我愿意和你一起，慢慢写，慢慢爱。']
    },
    platforms: [
      { name: 'Hobonavi官网', price: 328, badge: '正品保障', url: '' },
      { name: '淘宝文具店', price: 298, badge: '价格实惠', url: '' },
      { name: '京东文具', price: 318, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_039',
    name: 'Pilot 百乐 Capless 按动钢笔',
    category: 'stationery',
    basePrice: 580,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['stationery', 'reading', 'creative'],
    scores: { practical: 82, emotional: 75, unique: 78, budgetMatch: 0 },
    scenarios: ['工作办公：签字、记笔记，提升品味', '练字书写：钢笔爱好者的进阶之选', '日常携带：按动设计，不用拔笔帽', '礼物首选：实用又有质感的礼物'],
    reason: '百乐Capless是一支很有特色的钢笔——按动出尖，不用拔笔帽，像按动中性笔一样方便。18K金尖，写感顺滑，弹性十足。送TA这支钢笔，就是希望TA在工作中也能想起你，每写一个字，都是你的心意。',
    packaging: {
      ideas: ['配上一瓶百乐墨水（色彩雫系列）', '搭配一个笔袋或笔套', '在笔盒里放一张手写卡片'],
      wishes: ['愿你用这支笔，写出精彩人生；也用这支笔，写下我们的故事。', '每一笔都是心意，每一个字都是我对你的思念。']
    },
    platforms: [
      { name: '百乐官网', price: 580, badge: '正品保障', url: '' },
      { name: '京东自营', price: 520, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 560, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_040',
    name: '钢笔笔记本定制刻字礼盒套装',
    category: 'stationery',
    basePrice: 268,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['stationery', 'reading', 'creative'],
    scores: { practical: 80, emotional: 85, unique: 88, budgetMatch: 0 },
    scenarios: ['工作学习：记笔记、写工作计划', '日常记录：写日记、写手账', '商务馈赠：刻字定制，专属感强', '毕业礼物：学生党毕业季的好礼'],
    reason: '钢笔+笔记本的组合，经典又实用。刻上TA的名字、你们的纪念日，或是一句暖心的话，这份礼物就变得独一无二了。送TA这份礼物，就是想让TA在每一次书写时，都能感受到你的心意。',
    packaging: {
      ideas: ['定制礼盒包装，刻上名字或日期', '配上一瓶彩色墨水和替换笔尖', '在笔记本第一页写一段祝福语'],
      wishes: ['愿你写出精彩人生，也写出我们的故事。', '一笔一本，一心一意，一生一世。']
    },
    platforms: [
      { name: '淘宝定制', price: 268, badge: '可定制', url: '' },
      { name: '京东定制', price: 298, badge: '快速发货', url: '' },
      { name: '网易严选', price: 238, badge: '品质保证', url: '' }
    ],
    adInfo: null,
    image: ''
  }
];

module.exports = { part1Gifts };
