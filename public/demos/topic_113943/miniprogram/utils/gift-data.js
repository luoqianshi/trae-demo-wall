// 礼物数据库 + 关键词匹配库
// 共98条精选礼物，覆盖22个品类

const giftDatabase = [
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
  },
{
    id: 'gift_041',
    name: '小熊 加湿器 卧室静音大容量',
    category: 'home',
    basePrice: 199,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['home', 'lifestyle', 'quality-life'],
    scores: { practical: 85, emotional: 70, unique: 60, budgetMatch: 0 },
    scenarios: ['卧室加湿：秋冬干燥季节，保持空气湿润', '办公桌面：空调房里补水，皮肤不干燥', '静音设计：夜晚使用不打扰睡眠', '宿舍必备：学生党宿舍加湿神器'],
    reason: '小熊加湿器是秋冬季节的暖心之选。大容量水箱，不用频繁加水；静音设计，夜晚使用也不怕打扰睡眠。可爱的小熊造型，放在卧室或办公桌都很治愈。送TA这份礼物，就是给TA一份润物细无声的关怀——你的舒适，我时刻在意。',
    packaging: {
      ideas: ['用彩纸包装，系上可爱的蝴蝶结', '搭配几瓶香薰精油，加湿同时享受香氛', '写一张小卡片："愿你的每一天，都水润润的"'],
      wishes: ['愿你的生活，像湿润的空气一样，温柔而舒适。', '每一滴水都是我的心意，愿你永远水润年轻。']
    },
    platforms: [
      { name: '小熊电器官网', price: 199, badge: '正品保障', url: '' },
      { name: '京东自营', price: 179, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 189, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_042',
    name: '北极绒 法兰绒加厚毛毯',
    category: 'home',
    basePrice: 128,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['home', 'lifestyle', 'quality-life'],
    scores: { practical: 88, emotional: 75, unique: 55, budgetMatch: 0 },
    scenarios: ['秋冬保暖：沙发上追剧、看书，盖着暖暖的', '办公室午睡：午休时盖一下，不怕着凉', '宿舍必备：学生党冬天保暖神器', '车载便携：长途旅行时盖着休息'],
    reason: '法兰绒毛毯是秋冬最实用的温暖礼物。北极绒加厚款，柔软亲肤，保暖性好。窝在沙发上追剧、看书，或者办公室午休时盖一下，都暖暖的。送TA这份礼物，就是把温暖送到TA身边——愿我的爱，像这毛毯一样，时刻温暖着你。',
    packaging: {
      ideas: ['用丝带把毛毯卷成糖果状', '搭配一双毛绒袜子，温暖加倍', '写一张小卡片："愿这个冬天，有我有毛毯，你不再冷"'],
      wishes: ['愿你的冬天，有暖毯，有我，永远温暖。', '每一根绒毛都是我的思念，愿你时时刻刻都温暖。']
    },
    platforms: [
      { name: '北极绒官网', price: 128, badge: '正品保障', url: '' },
      { name: '京东自营', price: 108, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 118, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_043',
    name: '富士拍立得 相纸+相册收纳套装',
    category: 'photography',
    basePrice: 258,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['photography', 'creativity', 'lifestyle'],
    scores: { practical: 75, emotional: 88, unique: 72, budgetMatch: 0 },
    scenarios: ['情侣约会：拍下甜蜜瞬间，放进相册', '旅行出游：记录旅途风景，做成回忆册', '朋友聚会：派对上拍照，大家一起留念', '家居装饰：把照片贴满墙，都是回忆'],
    reason: '拍立得相纸和相册套装，是记录美好的最佳搭档。有了相纸，才能随时拍下美好瞬间；有了相册，才能把回忆好好珍藏。送TA这份礼物，就是想和TA一起，把每一个美好瞬间都拍下来、存起来，攒成一本厚厚的回忆。',
    packaging: {
      ideas: ['用礼盒包装，配上好看的丝带', '可以选卡通边、彩虹边等特殊相纸', '在相册第一页贴上你们的合照，写上祝福语'],
      wishes: ['愿我们一起拍下更多美好的瞬间，攒满一本又一本相册。', '每一张照片都是我们的故事，而故事还在继续。']
    },
    platforms: [
      { name: '富士官网', price: 258, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 238, badge: '官方授权', url: '' },
      { name: '京东自营', price: 248, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_044',
    name: 'Sony 索尼 ZV-1F Vlog相机',
    category: 'photography',
    basePrice: 3599,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['photography', 'creativity', 'lifestyle'],
    scores: { practical: 82, emotional: 85, unique: 78, budgetMatch: 0 },
    scenarios: ['Vlog拍摄：记录生活、旅行、美食，分享美好', '情侣日常：拍下你们的日常点滴，做成视频', '创作输出：自媒体、博主的入门之选', '旅行记录：轻便携带，记录旅途风景'],
    reason: '索尼ZV-1F是专为Vlog打造的相机。大光圈镜头，美颜效果自然，对焦快速准确。翻转屏方便自拍，机身轻便随身携带。如果TA喜欢记录生活、拍Vlog，送这个绝对没错。送TA这份礼物，就是支持TA的热爱，也想成为TA镜头里的主角。',
    packaging: {
      ideas: ['用高端礼盒包装，配上存储卡和相机包', '搭配一个桌面三脚架，拍Vlog更方便', '写一张小卡片："愿你记录生活的每一天，都有我在身边"'],
      wishes: ['愿你镜头里的世界，永远精彩；愿你身边的人，永远是我。', '想成为你视频里的常客，也想成为你人生里的主角。']
    },
    platforms: [
      { name: '索尼官网', price: 3599, badge: '正品保障', url: '' },
      { name: '京东自营', price: 3499, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3549, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_045',
    name: '富士 instax mini Link 手机照片打印机',
    category: 'photography',
    basePrice: 899,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['photography', 'creativity', 'lifestyle'],
    scores: { practical: 78, emotional: 85, unique: 75, budgetMatch: 0 },
    scenarios: ['即时打印：手机里的照片，立刻变成实体', '手账装饰：打印照片装饰手账本', '朋友聚会：派对上打印照片，大家分着看', '家居装饰：把喜欢的照片打印出来贴墙上'],
    reason: '富士instax mini Link照片打印机，让手机里的照片变成实体的回忆。连接手机APP，一键打印，还能加滤镜、拼贴。小巧便携，出去玩也能带着。送TA这份礼物，就是想和TA一起，把手机里的美好，都变成可以摸得到的回忆。',
    packaging: {
      ideas: ['配上几盒相纸（白边、彩虹边等）', '搭配一个可爱的收纳包', '在礼盒里放一张打印好的你们的合照'],
      wishes: ['愿我们的美好回忆，不仅在手机里，更在手中、在心里。', '每一张打印出来的照片，都是我想和你一起珍藏的时光。']
    },
    platforms: [
      { name: '富士官网', price: 899, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 799, badge: '官方授权', url: '' },
      { name: '京东自营', price: 849, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_046',
    name: '若态 Rokr 3D木质拼图八音盒',
    category: 'diy',
    basePrice: 368,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['diy', 'handmade', 'creative'],
    scores: { practical: 60, emotional: 88, unique: 85, budgetMatch: 0 },
    scenarios: ['情侣互动：一起拼拼图，享受协作时光', '减压放松：专注拼搭，忘记工作烦恼', '家居装饰：拼好后当摆件，还能播放音乐', '收藏爱好：木质拼图爱好者的收藏之选'],
    reason: '若态的3D木质拼图八音盒，是手工与音乐的完美结合。一块一块拼起来，最后能播放美妙的音乐，成就感满满。两个人一起拼，边拼边聊，几个小时的时光一下就过去了。送TA这份礼物，就是想和TA一起创造属于你们的"八音盒时光"。',
    packaging: {
      ideas: ['用礼盒包装，配上LED灯串', '搭配一个展示防尘罩，拼好后可以展示', '写一张小卡片："愿我们的爱情，像这音乐盒一样，永远有美妙的旋律"'],
      wishes: ['愿我们的爱情，像这音乐盒一样，永远有美妙的旋律。', '和你一起拼的每一块，都是我们幸福的拼图。']
    },
    platforms: [
      { name: '若态官网', price: 368, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 328, badge: '官方授权', url: '' },
      { name: '京东自营', price: 348, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_047',
    name: '数字油画 DIY手绘套装',
    category: 'diy',
    basePrice: 168,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['diy', 'handmade', 'creative'],
    scores: { practical: 55, emotional: 85, unique: 78, budgetMatch: 0 },
    scenarios: ['情侣互动：一起画一幅画，享受安静时光', '减压放松：专注画画，忘记工作压力', '家居装饰：画好后挂墙上，专属装饰画', '手作礼物：画好后送给TA，心意满满'],
    reason: '数字油画是零基础也能画的艺术。按数字填色，最后出来一幅漂亮的油画，成就感满满。两个人一起画，边画边聊，一个下午的时光安静又美好。画好后挂在家里，每次看到都会想起一起画画的时光。送TA这份礼物，就是想和TA一起，画出属于你们的美好。',
    packaging: {
      ideas: ['用画筒包装，文艺感满分', '搭配一套好看的画笔和颜料盘', '写一张小卡片："愿我们一起，画出属于我们的美好未来"'],
      wishes: ['愿我们的爱情，像这幅画一样，色彩斑斓，越画越美。', '每一笔都是我的心意，愿我们一起画出更多美好。']
    },
    platforms: [
      { name: '淘宝DIY店', price: 168, badge: '款式多样', url: '' },
      { name: '京东自营', price: 188, badge: '快速发货', url: '' },
      { name: '天猫旗舰店', price: 178, badge: '品质保证', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'priority', merchantId: 'merchant_diy_art', merchantName: '艺述手作' },
    image: ''
  },
  {
    id: 'gift_048',
    name: 'Chanel 香奈儿 Chance 邂逅香水',
    category: 'perfume',
    basePrice: 1150,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['perfume', 'beauty', 'fashion'],
    scores: { practical: 75, emotional: 92, unique: 80, budgetMatch: 0 },
    scenarios: ['日常使用：每天喷一喷，好心情从香味开始', '约会必备：专属味道，增加魅力值', '重要场合：面试、聚会，留香得体', '收藏爱好：香水爱好者的经典之选'],
    reason: '香奈儿邂逅香水是经典中的经典。清新的花香调，优雅又不失活泼，适合各种场合。圆瓶设计简约大方，放在梳妆台上也是一道风景。送她这款香水，是告诉她："你像这香水一样，优雅迷人，让我心动不已。"闻到这个味道，就会想起你。',
    packaging: {
      ideas: ['香奈儿原装礼盒，系上经典山茶花丝带', '搭配一个同系列身体乳，香味更持久', '写一张小卡片："这是我为你选的味道，就像你在我心里一样特别"'],
      wishes: ['愿你身上的味道，是我专属的记忆符号。', '闻香识你，这是我刻在心里的名字。']
    },
    platforms: [
      { name: '香奈儿官网', price: 1150, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1080, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1120, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_049',
    name: 'Hermes 爱马仕 大地男士香水',
    category: 'perfume',
    basePrice: 1080,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['perfume', 'beauty', 'fashion'],
    scores: { practical: 75, emotional: 90, unique: 82, budgetMatch: 0 },
    scenarios: ['日常使用：每天喷一喷，提升气质', '商务场合：沉稳的味道，专业可靠', '约会必备：成熟男人的味道，魅力值拉满', '收藏爱好：男士香水的经典之选'],
    reason: '爱马仕大地是男士香水的经典之作。木质香调，沉稳又有层次感，就像成熟男人的魅力。送他这款香水，是告诉他："你在我心里，就是这样沉稳可靠、值得依靠。"闻到这个味道，就会想起他——那个让你心安的人。',
    packaging: {
      ideas: ['爱马仕原装礼盒，高端大气', '搭配一个同系列沐浴露，香味更持久', '写一张小卡片："这是我为你选的味道，就像你给我的感觉一样，沉稳安心"'],
      wishes: ['愿你永远沉稳自信，而我永远在你身边。', '你身上的味道，是我最安心的依靠。']
    },
    platforms: [
      { name: '爱马仕官网', price: 1080, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 998, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1050, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_050',
    name: 'Diptyque 蒂普提克 香氛蜡烛礼盒',
    category: 'perfume',
    basePrice: 680,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['perfume', 'beauty', 'fashion'],
    scores: { practical: 65, emotional: 88, unique: 85, budgetMatch: 0 },
    scenarios: ['睡前放松：点上蜡烛，一天的疲惫都没了', '周末居家：看书、听音乐，蜡烛营造氛围', '约会之夜：烛光晚餐+香薰，浪漫加倍', '家居装饰：摆在那里就很好看'],
    reason: 'Diptyque是香氛界的文艺担当。来自巴黎的小众品牌，香味高级有格调，极简包装也很有设计感。礼盒装多种香味，可以慢慢尝试。送TA这份礼物，就是给TA的生活增添一份仪式感——点上蜡烛的那一刻，世界都安静了。',
    packaging: {
      ideas: ['用丝带绑好蜡烛，配上一盒长火柴', '搭配一个好看的烛台或托盘', '写一张小卡片："愿你的生活，有光有香有爱"'],
      wishes: ['愿你的生活，像这蜡烛一样，温暖而有光。', '点上蜡烛的那一刻，就像我在你身边一样温暖。']
    },
    platforms: [
      { name: 'Diptyque官网', price: 680, badge: '正品保障', url: '' },
      { name: '天猫国际', price: 620, badge: '海外直邮', url: '' },
      { name: '京东国际', price: 650, badge: '快速到货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_051',
    name: '陶艺/绘画/烘焙双人体验课',
    category: 'experience',
    basePrice: 388,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['experience', 'date', 'memory'],
    scores: { practical: 50, emotional: 95, unique: 92, budgetMatch: 0 },
    scenarios: ['情侣约会：一起做手工，享受二人时光', '生日礼物：用一场体验代替物质礼物', '纪念日：共同创作一件作品，纪念特别的日子', '周末休闲：找点有趣的事做，增进感情'],
    reason: '最好的礼物不是物品，而是共同的回忆。选一个你们都感兴趣的体验课——陶艺、绘画或烘焙，两个人一起动手创作，边做边聊，几个小时的时光快乐又充实。最后还能带一件你们共同完成的作品回家，每次看到都会想起那天的快乐。',
    packaging: {
      ideas: ['把体验券装在精美的信封里，附上手写卡片', '可以做一张"体验兑换券"，让TA选喜欢的项目', '搭配一束小花，在体验开始前送给TA'],
      wishes: ['愿我们一起尝试更多新鲜事，创造更多美好回忆。', '和你在一起的每一天，都是最好的礼物。']
    },
    platforms: [
      { name: '大众点评', price: 388, badge: '多样选择', url: '' },
      { name: '美团', price: 358, badge: '优惠多多', url: '' },
      { name: '小红书', price: 398, badge: '网红店铺', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_052',
    name: '周末城市周边度假民宿',
    category: 'experience',
    basePrice: 1200,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['experience', 'date', 'memory'],
    scores: { practical: 60, emotional: 95, unique: 88, budgetMatch: 0 },
    scenarios: ['情侣度假：远离城市喧嚣，享受二人世界', '生日惊喜：在特别的地方过生日', '纪念日：用一场短途旅行纪念你们的爱情', '放松减压：工作累了，去周边度个假'],
    reason: '谁说旅行一定要去远方？城市周边的特色民宿，就能给你们一场完美的短途度假。选一家有设计感的民宿，有山有水有温泉，两个人窝在里面，看看风景、聊聊天，暂时忘记工作和烦恼。送TA这份礼物，就是给TA一场说走就走的浪漫。',
    packaging: {
      ideas: ['把民宿预订信息做成精美的"度假兑换券"', '附上简单的行程安排和美食推荐', '写一张小卡片："周末，我们一起去逃离城市吧"'],
      wishes: ['愿我们一起看更多风景，走更多路。', '和你在一起，去哪里都是最好的旅行。']
    },
    platforms: [
      { name: ' Airbnb', price: 1200, badge: '特色民宿', url: '' },
      { name: '途家', price: 1080, badge: '选择多样', url: '' },
      { name: '携程', price: 1150, badge: '预订方便', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_053',
    name: '99朵玫瑰花束礼盒',
    category: 'flowers',
    basePrice: 399,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['flowers', 'romantic', 'lifestyle'],
    scores: { practical: 45, emotional: 98, unique: 75, budgetMatch: 0 },
    scenarios: ['情人节/520：最经典的浪漫表达', '生日惊喜：99朵玫瑰，99分的爱', '告白求婚：用玫瑰说出你的心意', '纪念日：用鲜花纪念特别的日子'],
    reason: '99朵玫瑰，是最经典也最浪漫的告白。99朵，寓意长长久久。一大束玫瑰捧在手里，哪个女生能不心动？礼盒包装，高端大气。送她这束花，就是告诉她："我对你的爱，长长久久，永不褪色。"',
    packaging: {
      ideas: ['选择高档礼盒包装，配上丝带和卡片', '可以在花束里藏一个小礼物（项链、戒指等）', '写一张手写卡片，说出你的心里话'],
      wishes: ['99朵玫瑰，99分的爱，剩下1分，用我的一生来补。', '愿我们的爱情，像玫瑰一样绚烂，长长久久。']
    },
    platforms: [
      { name: '花点时间', price: 399, badge: '新鲜直达', url: '' },
      { name: '野兽派', price: 599, badge: '高端品质', url: '' },
      { name: '花加', price: 368, badge: '性价比高', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_054',
    name: '郁金香/洋牡丹 混搭花束',
    category: 'flowers',
    basePrice: 268,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['flowers', 'romantic', 'lifestyle'],
    scores: { practical: 55, emotional: 90, unique: 80, budgetMatch: 0 },
    scenarios: ['日常惊喜：不是节日也能送花，给她小确幸', '办公室惊喜：送到她公司，让她被羡慕', '约会见面：约会时带一束花，浪漫加分', '家居装饰：放在家里，赏心悦目'],
    reason: '郁金香和洋牡丹，都是温柔又好看的花。不像玫瑰那么浓烈，却有着自己独特的美。混搭花束，色彩丰富，放在家里能让整个空间都亮起来。送她这束花，就是告诉她："生活需要一点小美好，而你，就是我最大的美好。"',
    packaging: {
      ideas: ['用牛皮纸或韩素纸包装，系上丝带', '搭配一个好看的花瓶，花到了就能插', '写一张小卡片："愿你的每一天，都像花一样美好"'],
      wishes: ['愿你的生活，像花一样灿烂，像花一样美好。', '你是我平淡生活里的那束光，那朵花。']
    },
    platforms: [
      { name: '花点时间', price: 268, badge: '新鲜直达', url: '' },
      { name: '花加', price: 238, badge: '性价比高', url: '' },
      { name: '野兽派', price: 368, badge: '高端品质', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_055',
    name: '永生花礼盒(玻璃罩/音乐盒款)',
    category: 'flowers',
    basePrice: 599,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['flowers', 'romantic', 'lifestyle'],
    scores: { practical: 50, emotional: 92, unique: 85, budgetMatch: 0 },
    scenarios: ['情人节/520：不凋谢的花，不凋谢的爱', '生日礼物：可以保存很久的浪漫', '纪念日：用永生花纪念你们的爱情', '家居装饰：摆在梳妆台或床头，好看又浪漫'],
    reason: '永生花，是不凋谢的浪漫。采用特殊工艺保存，可以放3-5年甚至更久。玻璃罩款精致唯美，音乐盒款还能播放美妙音乐。送她这份礼物，就是告诉她："我对你的爱，就像这永生花一样，永不凋谢，永远鲜活。"',
    packaging: {
      ideas: ['原装礼盒包装，高端大气', '可以在礼盒里放一条项链或手链，双重惊喜', '写一张小卡片："愿我们的爱情，像这永生花一样，永不凋谢"'],
      wishes: ['愿我们的爱情，像这永生花一样，永不凋谢，永远鲜活。', '你是我想要珍藏一辈子的宝贝。']
    },
    platforms: [
      { name: '野兽派', price: 599, badge: '高端品质', url: '' },
      { name: 'roseonly', price: 799, badge: '顶级品牌', url: '' },
      { name: '淘宝定制', price: 399, badge: '性价比高', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_056',
    name: '鲜切花 包月套餐(每周一束)',
    category: 'flowers',
    basePrice: 299,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['flowers', 'romantic', 'lifestyle'],
    scores: { practical: 65, emotional: 92, unique: 82, budgetMatch: 0 },
    scenarios: ['日常惊喜：每周一束花，好心情一整月', '办公室装饰：让她的工位美美哒', '居家美化：家里有花，生活有仪式感', '表达爱意：用一个月的鲜花说"我爱你"'],
    reason: '谁说鲜花只能送一次？包月鲜花套餐，让她一个月里每周都能收到鲜花，每次都是惊喜。花点时间、花加的花材新鲜、搭配好看。送她这份礼物，就是让她的一整个月，都有鲜花和你的爱陪伴——每周一束花，每天都想你。',
    packaging: {
      ideas: ['选择礼盒装配送，每次都有拆礼物的感觉', '第一束花里附上一张手写卡片', '可以选"每周一花"或"隔周一花"的套餐'],
      wishes: ['愿你的生活，像鲜花一样，永远灿烂绽放。', '每周都有花，每天都想你。这是我给你的浪漫。']
    },
    platforms: [
      { name: '花点时间', price: 299, badge: '性价比高', url: '' },
      { name: '野兽派', price: 499, badge: '高端品质', url: '' },
      { name: '花加', price: 259, badge: '款式多样', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_057',
    name: '东野圭吾/村上春树 作品全集套装',
    category: 'book',
    basePrice: 258,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['book', 'reading', 'self-improvement'],
    scores: { practical: 78, emotional: 75, unique: 68, budgetMatch: 0 },
    scenarios: ['日常阅读：睡前、通勤，沉浸在故事里', '兴趣爱好：小说迷的必备收藏', '心灵成长：好的书籍能带来思考和成长', '共同话题：你们都喜欢的作家，有聊不完的话题'],
    reason: '东野圭吾的推理、村上春树的文艺，都是很多人的心头好。一套全集，可以看很久，每一本都是一个新的世界。选TA喜欢的作家，送一套全集，既实用又有内涵。送书，是送TA一个更大的世界，也是送TA一段安静的时光。',
    packaging: {
      ideas: ['用牛皮纸包书，系上棉绳，文艺感满分', '每本书的扉页都写一句不同的话', '搭配一个好看的书签（可以是定制的）'],
      wishes: ['愿你在书里，找到更大的世界；也在我身边，找到最暖的港湾。', '读过的书会融进骨子里，而我对你的爱，会刻在心里。']
    },
    platforms: [
      { name: '当当网', price: 258, badge: '正版图书', url: '' },
      { name: '京东图书', price: 248, badge: '次日达', url: '' },
      { name: '淘宝书店', price: 228, badge: '价格优惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_058',
    name: '设计/艺术/摄影 精美画册',
    category: 'book',
    basePrice: 328,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['book', 'reading', 'self-improvement'],
    scores: { practical: 65, emotional: 80, unique: 82, budgetMatch: 0 },
    scenarios: ['咖啡桌书：摆在客厅或书房，有格调', '灵感来源：设计师、艺术家的灵感宝库', '休闲翻阅：没事翻一翻，享受视觉盛宴', '收藏爱好：画册爱好者的收藏之选'],
    reason: '一本精美的画册，是视觉的盛宴，也是灵感的来源。无论是设计、艺术还是摄影，好的画册都能带来美的享受和启发。放在家里，也是提升家居品味的装饰。送TA这份礼物，就是送TA一份美的享受——愿你永远能发现生活中的美。',
    packaging: {
      ideas: ['用礼品纸精心包装，系上丝带', '搭配一副白手套，翻阅画册更有仪式感', '写一张小卡片："愿你永远保有对美的热爱"'],
      wishes: ['愿你眼中有美，心中有爱，生活中有诗。', '你就是我生命中最美的风景。']
    },
    platforms: [
      { name: '当当网', price: 328, badge: '正版图书', url: '' },
      { name: '京东图书', price: 308, badge: '次日达', url: '' },
      { name: '淘宝书店', price: 288, badge: '价格优惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_059',
    name: '限量版签名版 书籍收藏版',
    category: 'book',
    basePrice: 168,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['book', 'reading', 'self-improvement'],
    scores: { practical: 45, emotional: 85, unique: 90, budgetMatch: 0 },
    scenarios: ['收藏爱好：书迷、藏书爱好者的宝贝', '生日礼物：送给喜欢读书的TA，独一无二', '纪念意义：作者签名，有特殊的纪念价值', '传家之宝：好的书可以传下去'],
    reason: '一本限量版签名书，是送给书迷的最好礼物。不仅是书，更是一份独一无二的收藏。作者的亲笔签名，让这本书有了特殊的意义和价值。如果TA是某个作家的粉丝，能收到签名版的书，一定会非常开心。送TA这份礼物，就是懂TA的证明。',
    packaging: {
      ideas: ['用定制的书盒保护，再用礼品纸包装', '搭配一个精美的书签', '写一张小卡片："愿你珍藏这本书，也珍藏我们的美好时光"'],
      wishes: ['愿你读过的每一本书，都成为你人生的财富。', '你是我想珍藏一辈子的宝贝。']
    },
    platforms: [
      { name: '孔夫子旧书网', price: 168, badge: '稀缺版本', url: '' },
      { name: '当当网', price: 198, badge: '正版限量', url: '' },
      { name: '淘宝书店', price: 158, badge: '价格优惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_060',
    name: '经典文学 精装礼盒版',
    category: 'book',
    basePrice: 199,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['book', 'reading', 'self-improvement'],
    scores: { practical: 70, emotional: 78, unique: 72, budgetMatch: 0 },
    scenarios: ['日常阅读：经典值得反复阅读', '收藏爱好：精装版值得收藏', '家居装饰：摆在书架上，提升格调', '学习提升：读经典，明事理'],
    reason: '经典文学，是经过时间考验的宝藏。精装礼盒版，装帧精美，值得收藏。一套3-5本，都是人类文学史上的经典之作。送TA这套书，就是送TA一份可以反复品味的精神食粮——经典永不过时，就像我对你的爱一样。',
    packaging: {
      ideas: ['原装礼盒包装，高端大气', '每本书的扉页都写一句寄语', '搭配一枚精致的金属书签'],
      wishes: ['愿你在经典中汲取智慧，在生活中收获幸福。', '你就是我人生中最珍贵的经典。']
    },
    platforms: [
      { name: '当当网', price: 199, badge: '正版图书', url: '' },
      { name: '京东图书', price: 188, badge: '次日达', url: '' },
      { name: '淘宝书店', price: 168, badge: '价格优惠', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_061',
    name: '情侣款T恤/卫衣 定制印花',
    category: 'clothes',
    basePrice: 299,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['clothes', 'fashion', 'couple'],
    scores: { practical: 75, emotional: 88, unique: 85, budgetMatch: 0 },
    scenarios: ['情侣出街：穿情侣装出街，甜蜜满分', '情侣照：拍情侣照时穿，超有感觉', '日常穿搭：休闲舒适，天天都能穿', '节日礼物：情人节、纪念日的甜蜜礼物'],
    reason: '情侣装是最直接的甜蜜宣告。定制印花，可以印上你们的合照、纪念日，或是只有你们懂的暗号。T恤或卫衣，休闲舒适，日常也能穿。两个人穿着一样的衣服走在街上，不用多说什么，甜蜜就溢出来了。送TA这份礼物，就是想和全世界宣布：这是我的人。',
    packaging: {
      ideas: ['用精美礼盒包装，放上两张拍立得照片', '可以做情侣款的帆布袋，搭配着送', '写一张小卡片："愿我们穿一辈子的情侣装"'],
      wishes: ['愿我们穿一辈子的情侣装，走一辈子的路。', '你是我想穿情侣装、想秀恩爱的那个人。']
    },
    platforms: [
      { name: '淘宝定制店', price: 299, badge: '可定制', url: '' },
      { name: '天猫旗舰店', price: 368, badge: '品质保证', url: '' },
      { name: '京东定制', price: 328, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_062',
    name: '羊绒围巾/羊毛围巾 冬季款',
    category: 'clothes',
    basePrice: 580,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['clothes', 'fashion', 'couple'],
    scores: { practical: 85, emotional: 88, unique: 72, budgetMatch: 0 },
    scenarios: ['秋冬保暖：冬天必备，温暖又好看', '日常搭配：搭配大衣、羽绒服都好看', '情侣款：买两条一样的，情侣围巾超甜', '节日礼物：圣诞节、新年的温暖礼物'],
    reason: '一条好的围巾，是冬天最温暖的陪伴。羊绒或羊毛材质，柔软亲肤，保暖性好。经典款式，百搭不过时。送TA这条围巾，就是把温暖围在TA脖子上——天冷了，注意保暖；而我，会一直温暖你。',
    packaging: {
      ideas: ['用精美礼盒包装，系上丝带', '搭配一顶同色系的帽子或手套', '写一张小卡片："天冷了，有我在，你不会冷"'],
      wishes: ['愿你的冬天，有暖围巾，有我，永远温暖。', '每一根毛线都是我的思念，愿你时时刻刻都温暖。']
    },
    platforms: [
      { name: '优衣库官网', price: 580, badge: '品质保证', url: '' },
      { name: '京东自营', price: 520, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 550, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_063',
    name: '品牌袜子/内衣 精致礼盒装',
    category: 'clothes',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['clothes', 'fashion', 'couple'],
    scores: { practical: 90, emotional: 75, unique: 65, budgetMatch: 0 },
    scenarios: ['日常穿着：贴身衣物，每天都用得上', '贴心关怀：关心TA的生活细节', '节日礼物：圣诞节、新年的实用礼物', '情侣款：买情侣款，甜蜜又实用'],
    reason: '送贴身衣物，是亲密关系的专属。品牌袜子或内衣，舒适好穿，礼盒包装又很有仪式感。虽然不像鲜花巧克力那么浪漫，但却是最实在的关怀——我关心你的每一个生活细节，包括贴身的舒适。送TA这份礼物，就是告诉TA：你的舒适，我都在意。',
    packaging: {
      ideas: ['原装礼盒包装，精致又好看', '可以搭配一瓶沐浴露或身体乳', '写一张小卡片："愿你每一天，都从内而外的舒服自在"'],
      wishes: ['愿你每一天都舒适自在，有我陪伴。', '我喜欢你的每一面，也关心你的每一个细节。']
    },
    platforms: [
      { name: '优衣库官网', price: 399, badge: '品质保证', url: '' },
      { name: '京东自营', price: 359, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 379, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_064',
    name: '三只松鼠/良品铺子 零食大礼包',
    category: 'food',
    basePrice: 168,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['food', 'gourmet', 'snack'],
    scores: { practical: 85, emotional: 72, unique: 50, budgetMatch: 0 },
    scenarios: ['追剧必备：窝在沙发上追剧，吃着零食超爽', '办公室零食：上班饿了垫垫肚子', '约会时光：两个人一起吃零食，看电影', '节日礼物：圣诞节、新年的小惊喜'],
    reason: '零食大礼包是最让人开心的礼物。一大包各种各样的零食，坚果、果干、肉脯、辣条……想吃什么都有。三只松鼠、良品铺子都是知名品牌，品质有保障。送TA这份大礼包，就是告诉TA：愿你每天都有好吃的，每天都开开心心的。',
    packaging: {
      ideas: ['原装大礼包已经很有分量了', '可以在里面藏一个小礼物（口红、耳机等）', '写一张小卡片："愿你每天都有好吃的，每天都有好心情"'],
      wishes: ['愿你每天都有好吃的，每天都有好心情。', '想把全世界的好吃的都给你，就像想把全世界的爱都给你一样。']
    },
    platforms: [
      { name: '三只松鼠官网', price: 168, badge: '正品保障', url: '' },
      { name: '京东自营', price: 148, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 158, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_065',
    name: '每日坚果/高端巧克力 礼盒装',
    category: 'food',
    basePrice: 288,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['food', 'gourmet', 'snack'],
    scores: { practical: 80, emotional: 78, unique: 68, budgetMatch: 0 },
    scenarios: ['日常营养：每天一包坚果，补充营养', '办公室零食：健康又好吃的下午茶', '节日礼物：新年、情人节的精致礼物', '贴心关怀：关心TA的健康和营养'],
    reason: '每日坚果或高端巧克力，是健康又精致的礼物。每日坚果每天一包，营养均衡；高端巧克力口感丝滑，是味蕾的享受。礼盒包装，高端大气。送TA这份礼物，就是关心TA的健康——不仅要好吃，还要健康。你的健康，对我来说最重要。',
    packaging: {
      ideas: ['原装礼盒包装，精致高端', '搭配一张手写卡片，表达你的关心', '可以选TA喜欢的口味组合'],
      wishes: ['愿你每天都营养满满，元气满满。', '你的健康快乐，是我最大的心愿。']
    },
    platforms: [
      { name: '三只松鼠官网', price: 288, badge: '正品保障', url: '' },
      { name: '京东自营', price: 258, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 268, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_066',
    name: '进口红酒/香槟 双支礼盒',
    category: 'food',
    basePrice: 680,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['food', 'gourmet', 'snack'],
    scores: { practical: 65, emotional: 85, unique: 75, budgetMatch: 0 },
    scenarios: ['纪念日：开一瓶红酒，庆祝特别的日子', '烛光晚餐：红酒+烛光晚餐，浪漫满分', '节日礼物：新年、圣诞节的品质礼物', '收藏爱好：红酒爱好者的收藏之选'],
    reason: '一瓶好的红酒，是品质生活的象征。进口红酒或香槟，双支礼盒装，高端大气。纪念日、节日时开一瓶，两个人小酌几杯，气氛瞬间就上来了。送TA这份礼物，就是想和TA一起，在微醺中诉说爱意——美酒配佳人，你就是我的佳人。',
    packaging: {
      ideas: ['原装木盒或皮盒包装，高端大气', '搭配一个开瓶器和两个红酒杯', '写一张小卡片："愿我们一起，品尝生活的甘甜"'],
      wishes: ['愿我们的爱情，像红酒一样，越陈越香。', '想和你一起喝很多很多酒，走很长很长的路。']
    },
    platforms: [
      { name: '也买酒', price: 680, badge: '正品保障', url: '' },
      { name: '京东自营', price: 620, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 650, badge: '官方授权', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'normal', merchantId: 'merchant_wine', merchantName: '醉美红酒庄' },
    image: ''
  },
  {
    id: 'gift_067',
    name: '宠物衣服/项圈 定制款',
    category: 'pets',
    basePrice: 128,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['pets', 'cute', 'lifestyle'],
    scores: { practical: 65, emotional: 82, unique: 80, budgetMatch: 0 },
    scenarios: ['宠物穿搭：给毛孩子打扮，可爱加倍', '情侣款：宠物款+主人款，一家三口超有爱', '节日装扮：过年、过节给宠物穿新衣服', '出门遛弯：戴着定制项圈，回头率超高'],
    reason: '如果TA养宠物，那送宠物用品绝对是加分项。定制的宠物衣服或项圈，可以印上宠物的名字、生日，或是你们的纪念日。看着毛孩子穿着你送的衣服，TA一定会很开心。送TA这份礼物，就是爱屋及乌——爱你，也爱你的毛孩子。',
    packaging: {
      ideas: ['用可爱的礼盒包装，放上宠物的小玩具', '可以定制"爸爸妈妈"的情侣款，一起穿', '写一张小卡片："替毛孩子谢谢你的礼物，也替我谢谢你的出现"'],
      wishes: ['愿我们和毛孩子，一直幸福地在一起。', '爱你，也爱你的毛孩子，爱你的一切。']
    },
    platforms: [
      { name: '淘宝定制店', price: 128, badge: '可定制', url: '' },
      { name: '京东宠物', price: 158, badge: '快速发货', url: '' },
      { name: '波奇网', price: 138, badge: '宠物用品', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_068',
    name: '宠物智能喂食器/摄像头',
    category: 'pets',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['pets', 'cute', 'lifestyle'],
    scores: { practical: 88, emotional: 75, unique: 72, budgetMatch: 0 },
    scenarios: ['上班放心：出门上班也能照顾毛孩子', '远程互动：想宠物了就看看，还能语音互动', '定时喂食：按时定量，科学喂养', '出差旅行：出门几天也不用担心宠物饿肚子'],
    reason: '宠物智能喂食器或摄像头，是养宠家庭的必备神器。上班、出差时，随时能看到宠物，还能定时喂食、语音互动。如果TA养宠物但经常不在家，送这个绝对是最实用的礼物。送TA这份礼物，就是帮TA解决后顾之忧——你的毛孩子，我也一起关心。',
    packaging: {
      ideas: ['原装礼盒包装，配上宠物零食', '可以写一张卡片："以后出门再也不用担心毛孩子啦"', '如果条件允许，可以一起安装，增加互动'],
      wishes: ['愿毛孩子健康成长，我们一起陪着它。', '你的毛孩子，就是我的毛孩子，我们一起爱它。']
    },
    platforms: [
      { name: '小米官网', price: 399, badge: '智能好物', url: '' },
      { name: '京东自营', price: 369, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 389, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_069',
    name: '宠物生日蛋糕+派对套装',
    category: 'pets',
    basePrice: 268,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['pets', 'cute', 'lifestyle'],
    scores: { practical: 50, emotional: 90, unique: 88, budgetMatch: 0 },
    scenarios: ['宠物生日：给毛孩子过一个特别的生日', '纪念日：把宠物当成家人，一起庆祝', '情侣互动：一起给宠物过生日，温馨又有爱', '拍照留念：宠物穿生日装，拍美美的照片'],
    reason: '给宠物过生日，是爱宠人士的仪式感。宠物专用的生日蛋糕，安全又好吃；派对套装有生日帽、装饰、蜡烛，氛围感拉满。如果TA把宠物当家人，那送这个一定会让TA非常感动。送TA这份礼物，就是告诉TA：你的毛孩子，也是我的家人。',
    packaging: {
      ideas: ['用可爱的礼盒包装，放上生日帽和装饰', '可以定制写着宠物名字的生日牌', '写一张小卡片："祝我们的毛孩子生日快乐，也祝我们一直在一起"'],
      wishes: ['愿毛孩子健康快乐，我们一直陪着它长大。', '你和毛孩子，都是我想珍惜的家人。']
    },
    platforms: [
      { name: '淘宝宠物店', price: 268, badge: '定制服务', url: '' },
      { name: '美团外卖', price: 288, badge: '同城配送', url: '' },
      { name: '波奇网', price: 258, badge: '宠物用品', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_070',
    name: '梵品 小型跑步机/椭圆机',
    category: 'sports',
    basePrice: 2499,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['sports', 'fitness', 'health'],
    scores: { practical: 85, emotional: 75, unique: 72, budgetMatch: 0 },
    scenarios: ['居家健身：不用去健身房，在家就能运动', '减脂塑形：坚持运动，保持好身材', '健康管理：每天动一动，身体更健康', '情侣互动：两个人一起运动，互相督促'],
    reason: '在家就能健身的小型跑步机或椭圆机，是送给健身爱好者或想开始运动的TA的好礼物。梵品的小型健身器材，不占地方，颜值也高，放在家里不突兀。送TA这份礼物，就是关心TA的健康——愿你健健康康，陪我走很长很长的路。',
    packaging: {
      ideas: ['配送上门安装，省心省力', '搭配一套运动服或运动手环', '写一张小卡片："愿你身体健康，我们一起运动到老"'],
      wishes: ['愿你身体健康，心情美丽，我们一起走很长的路。', '想和你一起运动，一起变老，一起看遍世界的风景。']
    },
    platforms: [
      { name: '梵品官网', price: 2499, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2299, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 2399, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
{
    id: 'gift_071',
    name: 'RIMOWA/新秀丽 登机箱',
    category: 'travel',
    basePrice: 3299,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['travel', 'wanderlust', 'adventure'],
    scores: { practical: 92, emotional: 75, unique: 78, budgetMatch: 0 },
    scenarios: ['商务出差：高品质登机箱，出差更有面儿', '旅行出游：短途旅行必备，说走就走', '日常通勤：东西多的时候用它装，省力又省心', '礼物升级：送TA一个说走就走的旅行箱'],
    reason: 'RIMOWA或新秀丽的登机箱，是品质生活的标配。德国工艺，坚固耐用，万向轮顺滑好推。经典款不过时，用十年都没问题。送TA这个登机箱，就是告诉TA："我想和你一起，去很多很多地方，看很多很多风景。"',
    packaging: {
      ideas: ['在行李箱上挂一个定制行李牌（刻上名字或纪念日）', '箱子里放一张旅行基金信封和手写卡片', '搭配一个便携旅行收纳套装'],
      wishes: ['愿我们一起走过很多路，看过很多风景，归来仍是彼此。', '人生就像一场旅行，很高兴一路上有你。']
    },
    platforms: [
      { name: 'RIMOWA官网', price: 3299, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3199, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_072',
    name: '便携颈枕+眼罩+毛毯 旅行套装',
    category: 'travel',
    basePrice: 258,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['travel', 'wanderlust', 'adventure'],
    scores: { practical: 90, emotional: 72, unique: 65, budgetMatch: 0 },
    scenarios: ['长途飞行：颈枕护颈，眼罩遮光，毛毯保暖', '高铁动车：舒适地度过几小时车程', '办公室午休：午睡三宝，下午精神满满', '出差必备：小巧便携，出差也能好好休息'],
    reason: '旅行三件套是出行必备神器。记忆棉颈枕支撑颈椎，真丝眼罩遮光助眠，法兰绒毛毯柔软保暖。一套在手，长途旅行也能舒舒服服。送TA这份贴心小礼，就是告诉TA："你的每一次出行，我都希望你舒适安心。"',
    packaging: {
      ideas: ['用一个好看的收纳袋装起来，系上丝带', '搭配一双便携拖鞋和耳塞，凑齐旅行五件套', '写一张小卡片："愿你每一次出行，都能舒适安心"'],
      wishes: ['愿你走过的路，都舒服顺心；愿你遇见的人，都温暖善良。', '你安心去看世界，我在这里等你回来。']
    },
    platforms: [
      { name: '淘宝精选', price: 258, badge: '三件套装', url: '' },
      { name: '京东自营', price: 298, badge: '次日达', url: '' },
      { name: '网易严选', price: 228, badge: '品质保证', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_073',
    name: '三亚/云南/成都 双人周末度假',
    category: 'travel',
    basePrice: 3500,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['travel', 'wanderlust', 'adventure'],
    scores: { practical: 70, emotional: 98, unique: 92, budgetMatch: 0 },
    scenarios: ['情侣度假：二人世界，甜蜜加倍', '生日惊喜：用一场旅行庆祝生日', '纪念日礼物：在特别的日子，去特别的地方', '减压放松：工作累了，一起出去散散心'],
    reason: '最好的礼物不是物品，而是共同的回忆。选一个你们都想去的地方，三亚看海、云南看风、成都吃火锅，来一场说走就走的双人旅行。送TA这份礼物，就是告诉TA："我想和你一起，创造更多属于我们的美好回忆。"',
    packaging: {
      ideas: ['把机票/酒店订单装在精美的信封里，附上行程单', '可以做一张"旅行兑换券"，让TA选时间和地点', '搭配一个拍立得，记录旅途的美好瞬间'],
      wishes: ['愿我们一起看遍世间美景，也一起度过细水长流。', '和你在一起的每一次旅行，都是最美的风景。']
    },
    platforms: [
      { name: '携程旅行', price: 3500, badge: '双人套餐', url: '' },
      { name: '飞猪旅行', price: 3200, badge: '优惠套餐', url: '' },
      { name: '去哪儿网', price: 3380, badge: '高性价比', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_074',
    name: '雀巢 Nespresso 胶囊咖啡机',
    category: 'tea-coffee',
    basePrice: 1990,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['tea-coffee', 'lifestyle', 'quality-life'],
    scores: { practical: 88, emotional: 78, unique: 75, budgetMatch: 0 },
    scenarios: ['早晨提神：一杯好咖啡，开启元气满满的一天', '下午茶时光：下午犯困，来杯咖啡提提神', '朋友来访：用咖啡招待朋友，有格调又方便', '情侣时光：周末一起在家做咖啡，享受慢生活'],
    reason: 'Nespresso胶囊咖啡机是咖啡爱好者的福音。一键出杯，操作简单，味道却不输咖啡店。多种风味胶囊可以选择，每天都有新鲜感。送TA这份礼物，就是给TA的生活增添一份仪式感——"愿你的每一天，都从一杯好咖啡开始。"',
    packaging: {
      ideas: ['搭配一盒混合口味的咖啡胶囊', '配上两个好看的咖啡杯', '写一张小卡片："愿你的每一天，都有咖啡和我"'],
      wishes: ['愿你的生活，像咖啡一样，苦中有甜，越品越香。', '每天早晨的第一杯咖啡，和你，都是我最期待的。']
    },
    platforms: [
      { name: 'Nespresso官网', price: 1990, badge: '正品保障', url: '' },
      { name: '京东自营', price: 1790, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1890, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_075',
    name: '象印/虎牌 保温杯礼盒装',
    category: 'tea-coffee',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['tea-coffee', 'lifestyle', 'quality-life'],
    scores: { practical: 95, emotional: 72, unique: 60, budgetMatch: 0 },
    scenarios: ['日常通勤：保温杯里泡枸杞，养生从今天开始', '办公必备：热水热茶随时有，工作更舒心', '冬天暖手：捧着保温杯，手暖心更暖', '情侣配对：买一对情侣款，走到哪带到哪'],
    reason: '象印或虎牌的保温杯，是保温杯界的扛把子。保温效果一流，颜值也在线。礼盒装送人有面子，自己用也舒心。送TA一个保温杯，就是告诉TA："多喝热水，照顾好自己，因为你健康，我才安心。"',
    packaging: {
      ideas: ['原装礼盒包装，系上丝带', '搭配一包好茶或好咖啡', '可以在杯身上刻上TA的名字或一句暖心的话'],
      wishes: ['愿你多喝水，多休息，好好照顾自己。', '一杯子的温暖，一辈子的陪伴。']
    },
    platforms: [
      { name: '象印官网', price: 399, badge: '正品保障', url: '' },
      { name: '京东自营', price: 359, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 379, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_076',
    name: '精选茶叶/咖啡豆 高端礼盒',
    category: 'tea-coffee',
    basePrice: 268,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['tea-coffee', 'lifestyle', 'quality-life'],
    scores: { practical: 82, emotional: 75, unique: 70, budgetMatch: 0 },
    scenarios: ['日常品饮：好茶好咖啡，每天都有好心情', '招待客人：用高端茶/咖啡招待朋友，有面子', '送礼佳品：节日拜访，送茶送咖啡准没错', '情侣时光：周末一起品茶/喝咖啡，享受慢生活'],
    reason: '一盒精选的茶叶或咖啡豆，是既有品味又实用的礼物。明前龙井、武夷岩茶、云南普洱，或是埃塞俄比亚耶加雪菲、哥伦比亚慧兰，总有TA喜欢的。高端礼盒包装，送人有面儿，自饮也舒心。送TA这份礼物，就是送TA一份品质生活。',
    packaging: {
      ideas: ['选择高端木盒或铁罐礼盒，质感满满', '搭配一套精致的茶具或咖啡器具', '写一张小卡片："愿你的生活，有茶香/咖啡香，也有我的陪伴"'],
      wishes: ['愿你的生活，像这茶/咖啡一样，越品越有味道。', '和你一起喝茶/咖啡的时光，是我最珍惜的慢时光。']
    },
    platforms: [
      { name: '小罐茶官网', price: 268, badge: '高端礼盒', url: '' },
      { name: '京东自营', price: 238, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 258, badge: '品质保证', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_077',
    name: '手工皮具 DIY 材料包(钱包/卡包)',
    category: 'handmade',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['handmade', 'diy', 'craft'],
    scores: { practical: 72, emotional: 92, unique: 88, budgetMatch: 0 },
    scenarios: ['情侣互动：一起做手工，享受协作时光', '减压放松：专注做手工，忘记工作烦恼', '礼物制作：亲手做的钱包，比买的更有意义', '兴趣培养：发现手工的乐趣，培养新爱好'],
    reason: '手工皮具DIY，是一件既有意义又有趣的事。真皮革材料，工具齐全，跟着教程一步步做，最后做出一个能用的钱包或卡包。送TA这份材料包，就是想和TA一起，花几个小时的时间，专注地做一件事，做出一个独一无二的、只属于你们的作品。',
    packaging: {
      ideas: ['材料包用礼盒包装好，附上一张"一起做手工吧"的邀请卡', '可以提前准备好工具和桌面保护垫', '做完后用好看的盒子装起来，写上制作日期'],
      wishes: ['愿我们一起动手，创造属于我们的独一无二。', '亲手做的东西，因为有了温度，所以格外珍贵。']
    },
    platforms: [
      { name: '淘宝手工店', price: 399, badge: '材料齐全', url: '' },
      { name: '京东手工', price: 458, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_078',
    name: '手工陶艺 茶杯/花瓶 DIY材料包',
    category: 'handmade',
    basePrice: 258,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['handmade', 'diy', 'craft'],
    scores: { practical: 65, emotional: 90, unique: 85, budgetMatch: 0 },
    scenarios: ['情侣约会：一起做陶艺，文艺又浪漫', '减压放松：玩泥巴是最好的解压方式', '家居装饰：做好的茶杯/花瓶，放在家里天天看', '兴趣培养：发现陶艺的乐趣，培养新爱好'],
    reason: '玩泥巴是每个人童年的快乐回忆。陶艺DIY材料包，让你在家就能体验拉坯的乐趣。可以做一个茶杯，每天喝水都用它；也可以做一个花瓶，插上鲜花装点生活。送TA这份礼物，就是想和TA一起，找回童年的简单快乐，做出一个独一无二的作品。',
    packaging: {
      ideas: ['材料包用好看的包装纸包起来，系上麻绳', '搭配一块围裙和袖套，防止弄脏衣服', '写一张小卡片："愿我们一起玩泥巴，一起做回小孩"'],
      wishes: ['愿我们的爱情，像这陶土一样，越捏越有形状。', '和你一起做手工的时光，简单又快乐。']
    },
    platforms: [
      { name: '淘宝手工店', price: 258, badge: '材料齐全', url: '' },
      { name: '京东手工', price: 298, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_079',
    name: '数字油画/水彩画 套装',
    category: 'arts',
    basePrice: 168,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['arts', 'creative', 'music'],
    scores: { practical: 55, emotional: 85, unique: 75, budgetMatch: 0 },
    scenarios: ['减压放松：画画是最好的解压方式', '情侣互动：一起画一幅画，享受安静的时光', '家居装饰：画好的画挂在墙上，好看又有意义', '兴趣培养：零基础也能画画，发现艺术的乐趣'],
    reason: '数字油画或水彩画套装，是零基础也能玩的艺术。数字油画只要按数字填色，就能画出一幅好看的画；水彩画套装工具齐全，跟着教程就能入门。送TA这份礼物，就是想和TA一起，安安静静地画一幅画，享受慢时光，也给家里添一幅有故事的装饰画。',
    packaging: {
      ideas: ['画具用礼盒包装，配上好看的画笔', '选择一幅你们的合照定制数字油画', '搭配一个画框，画好后可以直接挂起来'],
      wishes: ['愿我们的生活，像画一样，五彩斑斓。', '和你一起画画的时光，安静又美好。']
    },
    platforms: [
      { name: '淘宝画材店', price: 168, badge: '套装齐全', url: '' },
      { name: '京东文具', price: 198, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_080',
    name: '尤克里里/拇指琴 入门乐器',
    category: 'arts',
    basePrice: 399,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['arts', 'creative', 'music'],
    scores: { practical: 60, emotional: 88, unique: 82, budgetMatch: 0 },
    scenarios: ['业余爱好：学一门乐器，丰富业余生活', '情侣互动：一起学一首歌，弹给对方听', '减压放松：弹弹琴，忘记工作的烦恼', '才艺展示：聚会时露一手，惊艳全场'],
    reason: '尤克里里和拇指琴都是最容易上手的乐器。尤克里里小巧可爱，和弦简单，学几节课就能弹唱；拇指琴更小，揣兜里就能带，声音清脆好听。送TA这份礼物，就是送TA一个新爱好——"愿你的生活，有音乐为伴，也有我为你伴奏。"',
    packaging: {
      ideas: ['乐器用原装琴盒/琴包装好，配上拨片和备用琴弦', '搭配一本入门教程或线上课程', '写一张小卡片："愿你学会的第一首歌，是弹给我听的"'],
      wishes: ['愿你的生活，有音乐为伴，有我为你鼓掌。', '想和你一起学乐器，一起唱出我们的歌。']
    },
    platforms: [
      { name: '淘宝乐器店', price: 399, badge: '入门首选', url: '' },
      { name: '京东乐器', price: 458, badge: '快速发货', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_081',
    name: '博朗 5 系 男士电动剃须刀',
    category: 'electronics',
    basePrice: 599,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 95, emotional: 75, unique: 65, budgetMatch: 0 },
    scenarios: ['日常剃须：每天都用，每天都想起你', '商务出差：便携好用，出差也能保持清爽', '生日礼物：实用又贴心的男生礼物', '情侣日常：看着他用你送的剃须刀，幸福感满满'],
    reason: '博朗5系是男士剃须刀的经典之选。德国品质，刮得干净又舒服，干湿两用，洗澡时也能用。送他一把好剃须刀，就是告诉他："你的每一天，我都想参与，从清晨的第一缕胡须开始。"实用又贴心，每天都能用，每天都想起你。',
    packaging: {
      ideas: ['原装礼盒包装，系上丝带', '搭配一瓶剃须泡沫和须后水', '写一张小卡片："愿你每天都清清爽爽，帅帅气气"'],
      wishes: ['愿你每天都清爽自信，做最帅的自己。', '你认真刮胡子的样子，是我见过最帅的侧脸。']
    },
    platforms: [
      { name: '博朗官网', price: 599, badge: '正品保障', url: '' },
      { name: '京东自营', price: 549, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 579, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_082',
    name: 'Keychron K3 机械键盘',
    category: 'electronics',
    basePrice: 699,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 92, emotional: 80, unique: 78, budgetMatch: 0 },
    scenarios: ['工作办公：好键盘提升效率，打字也是享受', '游戏娱乐：机械键盘打游戏，手感超棒', '程序员必备：码农的生产力工具', '桌面美化：好看的键盘，桌面颜值upup'],
    reason: 'Keychron K3是超薄机械键盘的天花板。矮轴设计，轻薄便携，手感却不输全尺寸。蓝牙有线双模，Mac和Windows都能用。如果他是程序员、设计师，或者经常打字，送这个绝对没错。这不仅是礼物，更是懂他的证明——"我知道你每天敲代码/打字很辛苦，送你一把好键盘，陪你一起奋斗。"',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一个好看的键盘手托和键帽', '写一张小卡片："愿你敲出的每一行代码/每一个字，都闪闪发光"'],
      wishes: ['愿你工作顺利，代码无bug，生活有惊喜。', '你认真工作的样子最帅，我会一直支持你。']
    },
    platforms: [
      { name: 'Keychron官网', price: 699, badge: '正品保障', url: '' },
      { name: '京东自营', price: 649, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 679, badge: '官方授权', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'priority', merchantId: 'merchant_keychron', merchantName: 'Keychron官方' },
    image: ''
  },
  {
    id: 'gift_083',
    name: '罗技 MX Master 3S 无线鼠标',
    category: 'electronics',
    basePrice: 699,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 94, emotional: 72, unique: 68, budgetMatch: 0 },
    scenarios: ['工作办公：好鼠标提升效率，手腕也不累', '设计修图：精准追踪，设计师必备', '日常使用：舒适握感，用多久都不累', '桌面搭配：和机械键盘凑成一套，颜值拉满'],
    reason: '罗技MX Master 3S是办公鼠标的天花板。人体工学设计，握感舒适，用多久手腕都不累。电磁滚轮，滚动丝滑，精准追踪。多设备切换，办公效率翻倍。送他这只鼠标，就是告诉他："我知道你工作辛苦，送你一个好帮手，愿你工作顺利，少加班。"',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一个鼠标垫（可以定制图案）', '写一张小卡片："愿你工作顺利，少加班，多陪我"'],
      wishes: ['愿你工作轻松，生活如意，有我陪伴。', '你的努力我都看在眼里，疼在心里。']
    },
    platforms: [
      { name: '罗技官网', price: 699, badge: '正品保障', url: '' },
      { name: '京东自营', price: 649, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 679, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_084',
    name: '宝格丽 大吉岭茶 男士香水',
    category: 'perfume',
    basePrice: 780,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['perfume', 'beauty', 'fashion'],
    scores: { practical: 75, emotional: 90, unique: 82, budgetMatch: 0 },
    scenarios: ['日常使用：每天喷一点，清爽好闻', '商务场合：得体的香味，提升专业形象', '约会必备：好闻的味道，增加魅力值', '礼物首选：男士香水的经典之选'],
    reason: '宝格丽大吉岭茶是男士香水界的"初恋香"。清新的茶香调，干净温暖，不浓烈不刺鼻，谁闻了都喜欢。就像穿着白衬衫的少年，干净又阳光。送他这款香水，就是告诉他："你身上的味道，是我专属的心动记忆。"',
    packaging: {
      ideas: ['宝格丽原装礼盒，高端大气', '搭配一瓶同款香型的沐浴露或身体乳', '写一张小卡片："这是我为你选的味道，干净又温暖，就像你一样"'],
      wishes: ['愿你身上的味道，是我专属的记忆。', '闻香识你，这是我刻在心里的名字。']
    },
    platforms: [
      { name: '宝格丽官网', price: 780, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 699, badge: '官方授权', url: '' },
      { name: '京东自营', price: 729, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_085',
    name: 'Coach 男士皮带礼盒',
    category: 'clothes',
    basePrice: 1800,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['clothes', 'fashion', 'lifestyle'],
    scores: { practical: 85, emotional: 82, unique: 72, budgetMatch: 0 },
    scenarios: ['商务场合：皮带是男人的第二张名片', '日常穿搭：好皮带提升整体穿搭品味', '生日礼物：实用又有档次的礼物', '纪念日惊喜：送他一条好皮带，拴住他的人和心'],
    reason: 'Coach的男士皮带，是经典中的经典。双C扣头辨识度高，皮质柔软耐用，正装休闲都能搭。礼盒装送人有面子。送他一条好皮带，就是告诉他："你是我最想拴住的人，也是我最想共度一生的人。"实用又有心意，每天系着，每天都想起你。',
    packaging: {
      ideas: ['Coach原装礼盒包装，高端大气', '可以在皮带上刻字（名字或纪念日）', '搭配一个同品牌的钱包，组成套装'],
      wishes: ['愿我能像这条皮带一样，紧紧拴住你的心。', '你是我想拴住一辈子的人。']
    },
    platforms: [
      { name: 'Coach官网', price: 1800, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1599, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1699, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_086',
    name: '博朗 9 系 高端剃须刀',
    category: 'electronics',
    basePrice: 2499,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 96, emotional: 85, unique: 78, budgetMatch: 0 },
    scenarios: ['日常剃须：顶级体验，每天都是享受', '商务出差：高端便携，出差也有好状态', '生日礼物：送他最好的，他值得', '纪念日惊喜：实用又高端的礼物，他一定会喜欢'],
    reason: '博朗9系是剃须刀中的旗舰。四刀头设计，智能感应，刮得干净又温和。干湿两用，全身水洗，清洁方便。送他这个剃须刀，就是告诉他："你值得最好的，因为你是我最好的选择。"每天早上用的时候，都会想起你的好。',
    packaging: {
      ideas: ['原装高端礼盒包装，质感满满', '搭配一瓶高端剃须泡沫和须后乳', '写一张小卡片："愿你每天都清清爽爽，做最棒的自己"'],
      wishes: ['愿你每天都清爽自信，事业有成，爱情甜蜜。', '你值得最好的一切，而我想把最好的都给你。']
    },
    platforms: [
      { name: '博朗官网', price: 2499, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2199, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 2299, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_087',
    name: 'Air Jordan / Nike 限量款球鞋',
    category: 'clothes',
    basePrice: 1500,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['clothes', 'fashion', 'lifestyle'],
    scores: { practical: 78, emotional: 95, unique: 88, budgetMatch: 0 },
    scenarios: ['日常穿搭：潮人必备，穿搭加分', '收藏爱好：球鞋男孩的梦想', '运动健身：好鞋让运动更有动力', '生日礼物：送他心心念念的那双鞋'],
    reason: '每个男孩心里都有一双球鞋。Air Jordan或Nike的限量款，是球鞋爱好者的心头好。如果他喜欢球鞋，送他一双他心心念念的鞋，绝对会让他感动到哭——"原来我随口说的话，你都记在心里。"这不仅是一双鞋，更是你懂他的证明。',
    packaging: {
      ideas: ['原装鞋盒外加一层精美包装', '搭配一双定制鞋垫或鞋盾', '写一张小卡片："愿你穿上新鞋，走出属于自己的路"'],
      wishes: ['愿你脚下的路，越走越宽；愿我们的爱情，越走越远。', '想和你一起穿情侣鞋，走过大街小巷。']
    },
    platforms: [
      { name: 'Nike官网', price: 1500, badge: '正品保障', url: '' },
      { name: '得物APP', price: 1399, badge: '鉴别保真', url: '' },
      { name: '天猫旗舰店', price: 1459, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_088',
    name: 'TUMI 男士双肩包',
    category: 'clothes',
    basePrice: 2800,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['clothes', 'fashion', 'lifestyle'],
    scores: { practical: 95, emotional: 78, unique: 75, budgetMatch: 0 },
    scenarios: ['商务通勤：能装电脑，又有型', '出差旅行：容量大，分层多，出行必备', '日常使用：高品质背包，用十年都不坏', '礼物首选：送他一个好背包，陪他走四方'],
    reason: 'TUMI是男士双肩包的标杆。弹道尼龙材质，耐磨防水，用十年都不坏。分层设计合理，电脑、文件、随身物品都能装。商务休闲都能搭。送他这个背包，就是告诉他："我知道你要走很多路，愿这个包能替我陪着你，装下你的梦想，也装下我的牵挂。"',
    packaging: {
      ideas: ['原装防尘袋外加精美礼盒包装', '可以在包内标签上刻上他的名字', '搭配一个同品牌的钱包或护照夹'],
      wishes: ['愿你背上这个包，装得下梦想，也装得下我对你的爱。', '你走的每一步，都有我的思念陪伴。']
    },
    platforms: [
      { name: 'TUMI官网', price: 2800, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 2499, badge: '官方授权', url: '' },
      { name: '京东自营', price: 2599, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_089',
    name: 'Sony WH-1000XM5 头戴式降噪耳机',
    category: 'electronics',
    basePrice: 2699,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 93, emotional: 82, unique: 75, budgetMatch: 0 },
    scenarios: ['通勤路上：降噪模式，隔绝喧嚣，享受音乐', '工作办公：开放式办公室降噪专注，提高效率', '游戏娱乐：头戴式耳机，游戏沉浸感更强', '出差旅行：长途飞行降噪休息，旅途更舒适'],
    reason: '索尼WH-1000XM5是头戴式降噪耳机的天花板。业界顶级降噪，音质出色，佩戴舒适。30小时超长续航，出差旅行也不怕。送他这款耳机，就是告诉他："我知道你工作辛苦，送你一份宁静，让你在喧嚣的世界里，有一片属于自己的小天地。"',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一个耳机架，放在桌面好看又方便', '写一张小卡片："愿你在音乐的世界里，找到属于自己的宁静"'],
      wishes: ['愿你的世界，有音乐为伴，也有我为你守护的宁静。', '每一首歌都是我想对你说的话，降噪模式开启时，只听得到心跳。']
    },
    platforms: [
      { name: '索尼官网', price: 2699, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2399, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 2499, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_090',
    name: '美度 Mido 指挥官系列 机械表',
    category: 'watch',
    basePrice: 3200,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['watch', 'fashion', 'accessories'],
    scores: { practical: 85, emotional: 88, unique: 75, budgetMatch: 0 },
    scenarios: ['商务场合：机械表提升气质，专业可靠', '日常通勤：百搭款式，每天都能戴', '重要时刻：生日、升职、纪念日的礼物', '收藏入门：瑞士机械表的性价比之选'],
    reason: '美度指挥官系列是性价比超高的瑞士机械表。ETA机芯，走时精准，天文台认证。设计灵感来自建筑，大气有品味。商务休闲都能搭。送他这块表，就是告诉他："愿我们的爱情，像机械表一样，经得起时间的考验，越走越准，越久越珍贵。"',
    packaging: {
      ideas: ['原装表盒外加一层精致包装', '搭配一条皮质表带（替换用）', '写一张小卡片："时间会证明一切，包括我对你的爱"'],
      wishes: ['愿我们的爱情，像机械表一样，精准而持久。', '时间在走，世界在变，但我对你的爱，永远不变。']
    },
    platforms: [
      { name: '美度官网', price: 3200, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2899, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 2999, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_091',
    name: '万宝龙 大班系列 钢笔',
    category: 'stationery',
    basePrice: 3500,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['stationery', 'quality', 'premium'],
    scores: { practical: 72, emotional: 90, unique: 85, budgetMatch: 0 },
    scenarios: ['商务场合：签字时用，彰显品味', '日常书写：喜欢写字的人的梦想之笔', '收藏爱好：钢笔爱好者的终极梦想', '升职礼物：送他一支好笔，祝他步步高升'],
    reason: '万宝龙大班系列是钢笔界的传奇。黑白配色，六角白星标志，辨识度极高。书写流畅，手感一流。送他一支万宝龙，就是对他品味和事业的双重认可。"愿你用这支笔，签下更多大单，写出更精彩的人生。"而你，就是他人生中最美的篇章。',
    packaging: {
      ideas: ['万宝龙原装礼盒，高端大气', '搭配一瓶万宝龙墨水', '可以在笔身上刻上他的名字或一句寄语'],
      wishes: ['愿你用这支笔，写出属于我们的美好故事。', '每一笔都是心意，每一个字都是我对你的思念。']
    },
    platforms: [
      { name: '万宝龙官网', price: 3500, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 3199, badge: '官方授权', url: '' },
      { name: '京东自营', price: 3299, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_092',
    name: 'Apple Watch Series 9 智能手表',
    category: 'electronics',
    basePrice: 3199,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 92, emotional: 80, unique: 72, budgetMatch: 0 },
    scenarios: ['运动健身：记录运动数据，激励自己', '健康监测：心率、血氧、睡眠，全面关注', '日常通勤：消息提醒、接打电话，不用掏手机', '情侣互动：心跳分享、健身PK，甜蜜互动'],
    reason: 'Apple Watch Series 9是最受欢迎的智能手表。健康监测功能强大，运动模式丰富，还有各种实用功能。如果TA用iPhone，送这个绝对不会错。"愿这块表能替我，时刻关注你的健康，提醒你喝水、站起来活动。"你的健康，对我来说最重要。',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一个好看的替换表带（运动带/米兰尼斯）', '写一张小卡片："愿你的每一天，都健康、快乐、有我"'],
      wishes: ['愿你身体健康，心情美丽，我们一起走很长的路。', '每一次心跳，都是我在想你。这块表，替我守护你的健康。']
    },
    platforms: [
      { name: 'Apple官网', price: 3199, badge: '正品保障', url: '' },
      { name: '京东自营', price: 2999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 3099, badge: '分期免息', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_093',
    name: 'SKG 颈椎按摩仪',
    category: 'beauty',
    basePrice: 599,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 90, emotional: 82, unique: 70, budgetMatch: 0 },
    scenarios: ['工作间隙：颈椎累了，按摩15分钟，舒服多了', '追剧时光：边看剧边按摩，享受放松时光', '睡前放松：按摩一下，睡得更香', '贴心礼物：送TA健康，比什么都重要'],
    reason: '现在的人，谁颈椎没点毛病？SKG颈椎按摩仪，小巧轻便，挂在脖子上就能用。多种模式，热敷+按摩，就像有人在给你捏脖子。送TA这个按摩仪，就是告诉TA："我知道你工作/学习辛苦，颈椎一定很累，这个按摩仪替我给你按按，你要好好照顾自己。"',
    packaging: {
      ideas: ['原装礼盒包装，系上丝带', '搭配一盒蒸汽眼罩，护眼+护颈全套', '写一张小卡片："愿你颈椎不酸，腰背不痛，每天都舒服"'],
      wishes: ['愿你身体健康，每天都舒舒服服的。', '你的健康，是我最大的心愿。']
    },
    platforms: [
      { name: 'SKG官网', price: 599, badge: '正品保障', url: '' },
      { name: '京东自营', price: 549, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 579, badge: '官方授权', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'normal', merchantId: 'merchant_skg', merchantName: 'SKG官方' },
    image: ''
  },
  {
    id: 'gift_094',
    name: 'APM Monaco 项链',
    category: 'jewelry',
    basePrice: 1200,
    genderSuitability: ['female'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['jewelry', 'accessories', 'fashion'],
    scores: { practical: 75, emotional: 92, unique: 85, budgetMatch: 0 },
    scenarios: ['日常佩戴：低调精致，每天都能戴', '约会出门：戴上它，美美地去见你', '重要场合：派对、聚会，闪耀动人', '生日礼物：女生都爱的精致首饰'],
    reason: 'APM Monaco是来自摩纳哥的轻奢珠宝品牌。设计时尚有格调，星星、月亮、六芒星等元素浪漫又精致。送她一条APM项链，就是告诉她："你是我心里最闪耀的那颗星，也是我最想珍藏的宝贝。"戴上它，她就是最美的女孩。',
    packaging: {
      ideas: ['APM原装首饰盒，系上丝带', '搭配一束鲜花（玫瑰或满天星）', '写一张小卡片："你是我心里最亮的星"'],
      wishes: ['愿你像星星一样，永远闪耀，永远被爱。', '你是我眼里的光，是我心里的星。']
    },
    platforms: [
      { name: 'APM官网', price: 1200, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1080, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1150, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_095',
    name: 'Marshall Emberton 蓝牙音箱',
    category: 'electronics',
    basePrice: 1499,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['electronics', 'tech-gadgets', 'quality-life'],
    scores: { practical: 82, emotional: 85, unique: 80, budgetMatch: 0 },
    scenarios: ['居家休闲：洗澡、做饭、打扫都有音乐陪伴', '户外野餐：带着音箱去郊游，氛围感拉满', '朋友聚会：随时开启派对模式', '桌面装饰：好看的音箱，放在哪里都是风景'],
    reason: 'Marshall的音箱，光是颜值就赢了。复古摇滚风的设计，金色的logo，放在哪里都是一道风景线。音质更是没得说，低音浑厚，高音清亮。Emberton小巧便携，防水设计，户外也能用。送TA这个音箱，就是让音乐和颜值，同时陪伴TA。',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一张音乐会员年卡', '写一张小卡片："愿音乐和我，都能给你带来快乐"'],
      wishes: ['愿你的生活，有音乐为伴，也有我为你唱歌。', '每一个音符都是我对你的思念，愿你听到的每首歌都是甜的。']
    },
    platforms: [
      { name: 'Marshall官网', price: 1499, badge: '正品保障', url: '' },
      { name: '京东自营', price: 1299, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 1399, badge: '官方授权', url: '' }
    ],
    adInfo: { isAd: true, adLevel: 'normal', merchantId: 'merchant_marshall', merchantName: 'Marshall官方' },
    image: ''
  },
  {
    id: 'gift_096',
    name: '麦卡伦 12 年 单一麦芽威士忌',
    category: 'food',
    basePrice: 700,
    genderSuitability: ['male', 'other'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['food', 'gourmet', 'premium'],
    scores: { practical: 68, emotional: 88, unique: 82, budgetMatch: 0 },
    scenarios: ['独酌时光：周末小酌一杯，放松身心', '朋友聚会：好酒招待朋友，有面子', '收藏爱好：威士忌爱好者的入门经典', '生日礼物：送他一瓶好酒，他一定喜欢'],
    reason: '麦卡伦12年是单一麦芽威士忌的入门经典。斯佩塞产区，雪莉桶熟成，带有蜂蜜、干果、香料的风味。口感顺滑，层次丰富。送他一瓶好酒，就是告诉他："我知道你工作辛苦，偶尔小酌一杯，放松一下。"偶尔陪他喝两杯，也是不错的情侣时光。',
    packaging: {
      ideas: ['原装礼盒包装，高端大气', '搭配两个威士忌品鉴杯', '写一张小卡片："愿你工作顺利，生活有酒，身边有我"'],
      wishes: ['愿你的生活，像这酒一样，越陈越香。', '陪你喝酒，也陪你走人生路。']
    },
    platforms: [
      { name: '麦卡伦官网', price: 700, badge: '正品保障', url: '' },
      { name: '京东自营', price: 628, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 658, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_097',
    name: '大疆 Pocket 2 口袋云台相机',
    category: 'photography',
    basePrice: 2199,
    genderSuitability: ['female', 'male', 'other'],
    ageSuitability: ['18-22', '23-28', '29-35', '36-45'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'student', 'freelance'],
    tags: ['photography', 'creativity', 'lifestyle'],
    scores: { practical: 85, emotional: 88, unique: 82, budgetMatch: 0 },
    scenarios: ['旅行vlog：记录旅途的美好瞬间', '日常记录：生活中的小确幸，都拍下来', '情侣时光：用镜头记录你们的甜蜜日常', '创意创作：拍视频、剪vlog，发现新乐趣'],
    reason: '大疆Pocket 2是vlog神器。口袋大小，随身携带，随手就能拍。云台增稳，画面丝滑不抖。4K画质，颜值也高。送TA这个相机，就是想和TA一起，把生活中的美好瞬间都记录下来。"愿我们的故事，都能被镜头记录，被时光珍藏。"',
    packaging: {
      ideas: ['原装包装盒外加一个精美礼袋', '搭配一个便携收纳包和存储卡', '写一张小卡片："愿我们一起记录生活的美好"'],
      wishes: ['愿我们一起拍下更多美好的瞬间，攒满一本又一本相册。', '每一段视频都是我们的故事，而故事还在继续。']
    },
    platforms: [
      { name: '大疆官网', price: 2199, badge: '正品保障', url: '' },
      { name: '京东自营', price: 1999, badge: '次日达', url: '' },
      { name: '天猫旗舰店', price: 2099, badge: '官方授权', url: '' }
    ],
    adInfo: null,
    image: ''
  },
  {
    id: 'gift_098',
    name: 'La Mer 海蓝之谜 经典面霜',
    category: 'beauty',
    basePrice: 1650,
    genderSuitability: ['female'],
    ageSuitability: ['23-28', '29-35', '36-45', '46+'],
    careerSuitability: ['tech', 'creative', 'business', 'education', 'medical', 'arts', 'freelance'],
    tags: ['beauty', 'skincare', 'self-care'],
    scores: { practical: 88, emotional: 92, unique: 78, budgetMatch: 0 },
    scenarios: ['日常护肤：每天用，肌肤越来越好', '生日礼物：送她最顶级的护肤品', '节日惊喜：情人节、纪念日的奢宠礼物', '犒劳自己：她辛苦了，值得最好的呵护'],
    reason: 'La Mer经典面霜是护肤品界的传奇。神奇活性精萃，修护肌肤，让皮肤变得稳定、透亮、有光泽。虽然贵，但真的好用。送她这瓶面霜，就是告诉她："你值得最好的呵护，就像我对你的爱一样，用心滋养，从不吝啬。"你的女孩，值得用最好的。',
    packaging: {
      ideas: ['La Mer专柜礼盒包装，系上丝带', '搭配一套同款小样（精萃水、眼霜等）', '写一张小卡片："你值得最好的一切，包括最好的护肤品"'],
      wishes: ['愿你永远美丽动人，就像我们的爱情一样，越来越有光彩。', '你的美丽，值得用最好的来呵护；你的好，值得我用一生来珍藏。']
    },
    platforms: [
      { name: 'La Mer官网', price: 1650, badge: '正品保障', url: '' },
      { name: '天猫旗舰店', price: 1550, badge: '官方授权', url: '' },
      { name: '京东自营', price: 1599, badge: '次日达', url: '' }
    ],
    adInfo: null,
    image: ''
  }
];

const keywordMatchMap = {
  '耳机': 'electronics', '耳麦': 'electronics', '蓝牙': 'electronics',
  '手表': 'watch', '表': 'watch', '腕表': 'watch',
  '项链': 'jewelry', '手链': 'jewelry', '戒指': 'jewelry', '首饰': 'jewelry', '银饰': 'jewelry',
  '口红': 'cosmetics', '化妆品': 'cosmetics', '彩妆': 'cosmetics', '眼影': 'cosmetics', '粉底': 'cosmetics',
  '护肤品': 'beauty', '美容': 'beauty', '面膜': 'beauty', '精华': 'beauty',
  '文具': 'stationery', '手账': 'stationery', '笔记本': 'stationery', '钢笔': 'stationery',
  '家居': 'home', '加湿器': 'home', '香薰': 'home', '抱枕': 'home', '台灯': 'home',
  '相机': 'photography', '拍立得': 'photography', '摄影': 'photography',
  '手工': 'diy', 'DIY': 'diy', '拼装': 'diy', '拼图': 'diy',
  '香水': 'perfume', '香氛': 'perfume',
  '鲜花': 'flowers', '花束': 'flowers', '永生花': 'flowers',
  '书': 'book', '书籍': 'book', '绘本': 'book',
  '体验': 'experience', '演出': 'experience', '展览': 'experience', '课程': 'experience',
  '游戏': 'gaming', '游戏机': 'gaming', '手柄': 'gaming',
  '衣服': 'clothes', '服装': 'clothes', '卫衣': 'clothes', 'T恤': 'clothes',
  '零食': 'food', '美食': 'food', '巧克力': 'food', '糖果': 'food',
  '宠物': 'pets', '猫': 'pets', '狗': 'pets',
  '运动': 'sports', '健身': 'sports', '瑜伽': 'sports',
  '旅行': 'travel', '行李箱': 'travel', '登机箱': 'travel',
  '手作': 'handmade', '编织': 'handmade', '陶艺': 'handmade',
  '艺术品': 'arts', '画': 'arts', '雕塑': 'arts',
  '茶': 'tea-coffee', '咖啡': 'tea-coffee',
  '情侣': 'romantic', '男友': 'male', '女友': 'female',
  '实用': 'practical', '浪漫': 'emotional', '惊喜': 'unique'
};

module.exports = { giftDatabase, keywordMatchMap };