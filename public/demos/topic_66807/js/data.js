/* ============================================
   无聊APP · 预设演示数据
   ============================================ */

const DATA = {
  // 是否已完成强制画像
  profileSetupDone: false,

  // 当前用户
  me: {
    name: '无聊猫734',
    avatar: '🐱',
    sign: '天秤座',
    age: 25,
    decade: '00后',
    gender: '女',
    region: '北京',
    coin: 268,
    signDays: 7,
    achievements: [
      { id: 1, name: '选择困难症晚期', icon: '🎯', unlocked: true },
      { id: 2, name: '玄学大师', icon: '🔮', unlocked: true },
      { id: 3, name: '社交恐惧症患者', icon: '🙈', unlocked: true },
      { id: 4, name: '无聊战士', icon: '⚔️', unlocked: true },
      { id: 5, name: '火锅之王', icon: '🍲', unlocked: false },
      { id: 6, name: '天使在人间', icon: '👼', unlocked: true },
      { id: 7, name: '马拉松完赛者', icon: '🏃', unlocked: false },
      { id: 8, name: '富豪榜', icon: '💎', unlocked: false },
    ]
  },

  // 今日无聊指数
  boredIndex: { value: 87, change: 3 },

  // 天气预报
  weather: {
    icon: '⛅',
    text: '今天天秤座区域：多云转晴，适合主动出击。局部地区有贵人出没。'
  },

  // 在线人数
  onlineCount: 1283,

  // 今日精选
  picks: [
    { tag: '✈️', text: '漂流瓶已上岸：「如果你有3000亿，你吃吗？」', sub: '12人传递 · 23分钟前' },
    { tag: '🌟', text: '一位天秤座用户选了红色，结果真的遇到了好事', sub: '无聊猫734 · 1小时前' },
    { tag: '🍲', text: '有人刚刚在火锅里加了500片毛肚', sub: '火锅侠0923 · 刚刚' },
  ],

  // 广场子板块
  squareBoards: [
    { id: 'together', name: '一起去无聊', icon: '🚶', color: 'var(--sky)', desc: '穿搭/美食/旅游分享', interact: '漂浮胶囊' },
    { id: 'treehole', name: '无聊树洞', icon: '🕳️', color: 'var(--grape)', desc: '匿名吐槽一切', interact: '戳气泡' },
    { id: 'brag', name: '无聊吹牛', icon: '🐂', color: 'var(--red)', desc: '比谁吹得有意思', interact: '戳气泡' },
    { id: 'vote', name: '无聊投票', icon: '📊', color: 'var(--mustard)', desc: '每日奇葩问题', interact: '两个大按钮' },
    { id: 'waste', name: '变废为废', icon: '♻️', color: 'var(--mint)', desc: '把废品变更废', interact: '切西瓜降落' },
    { id: 'praise', name: '无聊夸夸墙', icon: '💌', color: 'var(--pink)', desc: '匿名夸夸别人', interact: '戳气泡' },
    { id: 'challenge', name: '无聊挑战', icon: '⚡', color: 'var(--red)', desc: '打卡挑战', interact: '进度方块' },
  ],

  // 一起去无聊 - 胶囊（每批10个，可循环）
  capsules: [
    { color: 'var(--red)', premium: false, title: '天秤座今日选红色，真的遇到了贵人！', preview: '早上穿了红色卫衣，下午老板就给我加薪了', tag: '00后·天秤·女·北京', poster: '无聊猫734', avatar: '🐱' },
    { color: 'var(--grape)', premium: true, title: '火锅配红酒，我的今日快乐套餐', preview: '一个人吃了两人份，快乐加倍', tag: '90后·天蝎·男·上海', poster: '火锅侠0923', avatar: '🦁' },
    { color: 'var(--mint)', premium: false, title: '穿绿色去面试，竟然一次过！', preview: '面试官说我看起来很有活力', tag: '00后·巨蟹·女·杭州', poster: '天使在人间', avatar: '😇' },
    { color: 'var(--mustard)', premium: true, title: '我决定今天去大理，说走就走', preview: '机票已买，明天出发', tag: '90后·狮子·女·广州', poster: '辣妹666', avatar: '💃' },
    { color: 'var(--sky)', premium: false, title: '如果我有3000亿，我选择……', preview: '先买一座岛，再养100只猫', tag: '80后·双鱼·男·深圳', poster: '树洞者007', avatar: '🐟' },
    { color: 'var(--pink)', premium: false, title: '今天撸了8只猫，幸福指数拉满', preview: '小区楼下的猫都认识我了', tag: '00后·白羊·女·成都', poster: '追风少女', avatar: '🏹' },
    { color: 'var(--red)', premium: true, title: '加班到凌晨三点，写下我的怨念', preview: '老板说要"再优化一下"，第18版了', tag: '90后·处女·男·北京', poster: '修仙者001', avatar: '🧙' },
    { color: 'var(--mint)', premium: false, title: '今天地铁上让座被拒，对方说"我还年轻"', preview: '对方看起来60+', tag: '70后·金牛·女·武汉', poster: '躺平青年', avatar: '🛌' },
    { color: 'var(--mustard)', premium: false, title: '我决定从今天开始减肥，明天再说', preview: '今晚先吃一顿好的告别昨天的自己', tag: '00后·双子·女·南京', poster: '吃货本货', avatar: '🐂' },
    { color: 'var(--grape)', premium: false, title: '失眠第7天，凌晨三点在数羊', preview: '已经数到第1283只了，越来越精神', tag: '90后·水瓶·男·西安', poster: '夜猫子', avatar: '🦉' },
    { color: 'var(--sky)', premium: true, title: '把简历投给了梦想公司，今天收到回复', preview: '回复说：感谢投递，简历将进入人才库', tag: '00后·天秤·女·苏州', poster: '发呆冠军', avatar: '😶' },
    { color: 'var(--pink)', premium: false, title: '今天和喜欢的人表白了，结果……', preview: '对方说"我们还是做朋友吧"', tag: '90后·射手·男·长沙', poster: '白日梦想家', avatar: '💭' },
  ],

  // 树洞吐槽
  treeholePosts: [
    { text: '老板今天又让我加班，说好的双休呢？', comments: [{ user: '90后·射手', text: '同款老板，抱抱', time: '1分钟前' }] },
    { text: '朋友借了500块，半年了还没还', comments: [{ user: '00后·天秤', text: '下次记得写欠条', time: '3分钟前' }] },
    { text: '今天地铁上有人外放抖音，我忍了一路', comments: [{ user: '95后·天蝎', text: '降噪耳机救我命', time: '5分钟前' }] },
    { text: '我妈又催我相亲，我今年才25啊', comments: [{ user: '00后·双子', text: '25怎么了！', time: '8分钟前' }] },
    { text: '外卖迟到了40分钟，汤都洒了', comments: [] },
    { text: '楼上装修一个月了，我快疯了', comments: [{ user: '90后·处女', text: '建议买耳塞', time: '12分钟前' }] },
    { text: '今天被同事甩锅，我直接怼回去了', comments: [{ user: '95后·狮子', text: '怼得好', time: '15分钟前' }] },
    { text: '健身房教练说我体脂太高，扎心了', comments: [] },
    { text: '双十一买的衣服到现在没发货', comments: [{ user: '00后·巨蟹', text: '我也是', time: '20分钟前' }] },
    { text: '老板说我的方案不行，又不告诉我哪里不行', comments: [{ user: '90后·摩羯', text: '太真实了', time: '22分钟前' }] },
    { text: '朋友聚会全程玩手机，我像个透明人', comments: [] },
    { text: '今天又失眠了，凌晨三点还在看天花板', comments: [{ user: '95后·双鱼', text: '早点放下手机', time: '30分钟前' }] },
  ],

  // 吹牛内容
  bragPosts: [
    { content: '我昨天和马云吃了顿饭，他非要拜我为师', likes: 23, comments: [{ user: '00后·白羊', text: '马云：我什么时候说的', time: '2分钟前' }] },
    { content: '我家猫今天给我做了顿饭，还挺好吃', likes: 18, comments: [{ user: '95后·金牛', text: '猫：我也想尝尝', time: '4分钟前' }] },
    { content: '我跑步的时候，博尔特在后面追我', likes: 31, comments: [] },
    { content: '我今天捡了100万，然后捐给了流浪猫', likes: 15, comments: [{ user: '90后·巨蟹', text: '猫：谢谢老板', time: '6分钟前' }] },
    { content: '我睡觉的时候，梦到自己成了联合国秘书长', likes: 27, comments: [] },
    { content: '我做的菜，米其林三星大厨偷师', likes: 22, comments: [{ user: '00后·狮子', text: '厨师：菜谱发一下', time: '10分钟前' }] },
    { content: '我家的狗会唱歌，还会写诗', likes: 19, comments: [] },
    { content: '我今天打游戏，职业选手加我好友', likes: 34, comments: [{ user: '95后·天蝎', text: '然后输了', time: '12分钟前' }] },
    { content: '我减肥只用了三天，从200斤到120斤', likes: 42, comments: [{ user: '90后·双子', text: '医生建议多吃肉', time: '15分钟前' }] },
    { content: '我上班摸鱼的时候，老板给我涨了工资', likes: 28, comments: [] },
    { content: '我写的代码，bug看了都自杀了', likes: 36, comments: [{ user: '00后·水瓶', text: 'bug：我先溜了', time: '18分钟前' }] },
    { content: '我今天出门，三条街的人都在看我', likes: 25, comments: [{ user: '95后·天秤', text: '因为你没穿裤子', time: '20分钟前' }] },
  ],

  // 投票
  votes: [
    { day: '第1天', q: '给你3000亿，但必须用鼻子吃完一碗面，你选吗？', a: '吃！', b: '不吃！', va: 67, vb: 33 },
    { day: '第2天', q: '世界末日倒数60秒，你带什么上诺亚方舟？', a: '手机', b: '猫', va: 45, vb: 55 },
    { day: '第3天', q: '你愿意用一年的寿命换10个亿吗？', a: '愿意', b: '不愿意', va: 52, vb: 48 },
    { day: '第4天', q: '下辈子必须投胎成一种食物，你选？', a: '火锅', b: '冰淇淋', va: 78, vb: 22 },
    { day: '第5天', q: '穿越到古代当皇帝，还是留在现代当普通人？', a: '当皇帝', b: '做凡人', va: 61, vb: 39 },
  ],

  // 投票评论
  voteComments: [
    { user: '匿名·00后·天秤', text: '吃！3000亿够我吃一辈子面', time: '10分钟前', side: 'A' },
    { user: '匿名·90后·天蝎', text: '不吃，我要尊严', time: '20分钟前', side: 'B' },
    { user: '匿名·00后·巨蟹', text: '可以用鼻子吃完吗？我试试', time: '35分钟前', side: 'A' },
  ],

  // 变废为废
  wastePosts: [
    { icon: '📦', title: '如何把快递箱变成……更废的纸箱', text: '第一步：把纸箱拆开。第二步：揉皱。第三步：再装回去。完成！它现在是一个更废的纸箱了。' },
    { icon: '☂️', title: '如何把坏掉的雨伞变成……更废的雨伞', text: '把伞骨拆了当晾衣杆，伞面当桌布——然后发现晾衣杆撑不住衣服，桌布漏水。' },
    { icon: '📱', title: '如何把旧手机变成……更废的砖头', text: '把手机拆了，零件摆成一朵花——然后发现装不回去了。' },
    { icon: '🧦', title: '如何把破洞袜子变成……更废的抹布', text: '把袜子剪开，当抹布——擦了桌子更脏了。' },
    { icon: '🍾', title: '如何把空瓶子变成……更废的装饰品', text: '把瓶子涂上颜料，放上干花——三天后发霉了。' },
    { icon: '📰', title: '如何把报纸变成……更废的纸飞机', text: '折成飞机，飞出去——飞到了水坑里。' },
  ],

  // 夸夸墙
  praises: [
    { content: '今天在地铁上给我让座的那个人，你真帅！', mine: false },
    { content: '你昨天在会议上发言的时候，光芒万丈！', mine: false },
    { content: '你是这世界上最温暖的太阳！', mine: true },
    { content: '谢谢你帮我拿快递，你人太好了！', mine: false },
    { content: '你笑起来的样子，像春天的风！', mine: false },
    { content: '你做的饭是世界上最好吃的！', mine: true },
    { content: '昨天在电梯里帮我按楼层的那个人，谢谢你！', mine: false },
    { content: '你的声音好好听，多说几句话吧！', mine: true },
    { content: '你认真学习的样子，真的很迷人！', mine: false },
    { content: '你是我见过最善良的人！', mine: false },
  ],

  // 挑战 - 每天照片+描述
  challenges: [
    {
      title: '连续7天穿红色袜子打卡', founder: '无聊猫734', total: 7, current: 3, joined: true, myDay: 3,
      founderDays: [
        { day: 1, photo: '🧦', desc: '第一天打卡！穿上红色袜子，心情莫名好起来，今天去超市买到了打折的牛奶。' },
        { day: 2, photo: '🧦', desc: '第二天，红色袜子让我的脚暖和，老板今天没让我加班，玄学应验了。' },
        { day: 3, photo: '🧦', desc: '第三天，地铁上有人盯着我袜子看，可能是觉得我品味独特吧。' },
      ],
      participants: [
        { name: '无聊猫734', sign: '天秤', decade: '00后', day: 3, me: true, avatar: '🐱',
          days: [
            { day: 1, photo: '🧦', desc: '跟风第一天！希望好事发生。' },
            { day: 2, photo: '🧦', desc: '第二天，今天穿了红色袜子去约会。' },
            { day: 3, photo: '🧦', desc: '第三天，同事问我为什么天天穿红袜子。' },
          ]
        },
        { name: '火锅侠0923', sign: '天蝎', decade: '90后', day: 2, avatar: '🦁',
          days: [
            { day: 1, photo: '🧦', desc: '加入挑战！第一天打卡。' },
            { day: 2, photo: '🧦', desc: '第二天，今天吃了火锅配红袜子。' },
          ]
        },
        { name: '辣妹666', sign: '狮子', decade: '90后', day: 5, avatar: '💃',
          days: [
            { day: 1, photo: '🧦', desc: '开始打卡！' },
            { day: 2, photo: '🧦', desc: '第二天，配红色连衣裙绝配。' },
            { day: 3, photo: '🧦', desc: '第三天，被夸袜子好看。' },
            { day: 4, photo: '🧦', desc: '第四天，已经习惯了。' },
            { day: 5, photo: '🧦', desc: '第五天，胜利在望！' },
          ]
        },
        { name: '树洞者007', sign: '双鱼', decade: '80后', day: 1, avatar: '🐟',
          days: [{ day: 1, photo: '🧦', desc: '第一天，新加入的。' }]
        },
        { name: '天使在人间', sign: '巨蟹', decade: '00后', day: 4, avatar: '😇',
          days: [
            { day: 1, photo: '🧦', desc: '开始！' },
            { day: 2, photo: '🧦', desc: '第二天打卡。' },
            { day: 3, photo: '🧦', desc: '第三天。' },
            { day: 4, photo: '🧦', desc: '第四天，半程啦！' },
          ]
        },
        { name: '修仙者001', sign: '摩羯', decade: '90后', day: 3, avatar: '🧙',
          days: [{ day: 1, photo: '🧦', desc: '打卡1' }, { day: 2, photo: '🧦', desc: '打卡2' }, { day: 3, photo: '🧦', desc: '打卡3' }]
        },
        { name: '躺平青年', sign: '水瓶', decade: '70后', day: 2, avatar: '🛌',
          days: [{ day: 1, photo: '🧦', desc: 'day1' }, { day: 2, photo: '🧦', desc: 'day2' }]
        },
        { name: '吃货本货', sign: '金牛', decade: '00后', day: 6, avatar: '🐂',
          days: Array.from({length:6}, (_,i)=>({day:i+1, photo:'🧦', desc:`第${i+1}天`}))
        },
        { name: '夜猫子', sign: '白羊', decade: '90后', day: 1, avatar: '🦉',
          days: [{ day: 1, photo: '🧦', desc: '加入！' }]
        },
        { name: '追风少女', sign: '射手', decade: '00后', day: 3, avatar: '🏹',
          days: [{ day: 1, photo: '🧦', desc: 'day1' }, { day: 2, photo: '🧦', desc: 'day2' }, { day: 3, photo: '🧦', desc: 'day3' }]
        },
      ],
      comments: [
        { user: '匿名·00后·天秤', text: '我今天穿了红色袜子，结果真的遇到了好事！', time: '10分钟前' },
        { user: '匿名·90后·天蝎', text: '第三天打卡，坚持就是胜利', time: '1小时前' },
        { user: '匿名·00后·处女', text: '我要加入，明天开始', time: '2小时前' },
      ]
    },
    {
      title: '每天喝8杯水打卡', founder: '养生大师', total: 21, current: 12, joined: false, myDay: 0,
      founderDays: Array.from({length:12}, (_,i)=>({day:i+1, photo:'💧', desc:`第${i+1}天，喝了8杯水，感觉自己变健康了。`})),
      participants: [], comments: []
    },
    {
      title: '一周不迟到打卡', founder: '早鸟协会', total: 5, current: 2, joined: false, myDay: 0,
      founderDays: [{day:1, photo:'⏰', desc:'第一天准时到！'},{day:2, photo:'⏰', desc:'第二天差点迟到'}],
      participants: [], comments: []
    },
  ],

  // 火锅店 - 重写：锅+10凳子+加料历史
  hotpot: {
    online: 47,
    totalAdded: 0,        // 当前锅里的料总量
    overflowAt: 3000,     // 溢出阈值
    history: [            // 加料历史
      { user: '火锅侠0923', text: '加了100份毛肚', time: '刚刚', amount: 100, ico: '🍖' },
      { user: '辣妹666', text: '加了50份羊肉', time: '2分钟前', amount: 50, ico: '🥩' },
      { user: '无聊猫734', text: '加了10份虾滑', time: '5分钟前', amount: 10, ico: '🍤' },
    ],
    foodTypes: [
      { key: 'maodu', name: '毛肚', ico: '🍖' },
      { key: 'yangrou', name: '羊肉', ico: '🥩' },
      { key: 'xiaxie', name: '虾滑', ico: '🍤' },
      { key: 'shucai', name: '蔬菜', ico: '🥬' },
      { key: 'doufu', name: '豆腐', ico: '🧈' },
      { key: 'mian', name: '面条', ico: '🍜' },
    ],
    amounts: [1, 10, 50, 100, 500],
    // 10个凳子
    seatUsers: [
      { name: '火锅侠0923', avatar: '🦁', taken: true },
      { name: '辣妹666', avatar: '💃', taken: true },
      { name: '', avatar: '', taken: false },
      { name: '天使在人间', avatar: '😇', taken: true },
      { name: '吃货本货', avatar: '🐂', taken: true },
      { name: '', avatar: '', taken: false },
      { name: '追风少女', avatar: '🏹', taken: true },
      { name: '躺平青年', avatar: '🛌', taken: true },
      { name: '', avatar: '', taken: false },
      { name: '夜猫子', avatar: '🦉', taken: true },
    ],
    meSeated: false,
    meSeatIdx: -1,
  },

  // 无聊富豪 · 互动预设
  richPresets: {
    boss: [
      '给小弟们一人买辆跑车',
      '请全场喝香槟',
      '买下这家店',
      '给小妹买爱马仕',
      '带所有人去海岛度假',
      '每人发一个大红包',
    ],
    follower: [
      { role: '小弟', text: '大哥给我买个爱马仕包包呗', reply: '大哥：买！十个够不够？' },
      { role: '小妹', text: '大姐带我去巴黎shopping嘛~', reply: '大姐：走，头等舱已备好。' },
      { role: '小弟', text: '大哥，我想要辆兰博基尼', reply: '大哥：钥匙拿去，别刮花了。' },
      { role: '小妹', text: '大姐，我想住海边大别墅', reply: '大姐：明天就过户到你名下。' },
      { role: '小弟', text: '大哥请全场喝酒！', reply: '大哥：开一瓶 82 年的拉菲。' },
      { role: '小妹', text: '大姐我想要鸽子蛋钻戒~', reply: '大姐：钻石已包好，签收吧。' },
    ]
  },

  // NPC回复模板（吹牛商城 · 只卖奢侈品）
  npcReplies: [
    { keys: ['爱马仕', '包', '包包'], reply: '好嘞！您这品味，简直就是当代盖茨比！爱马仕已经给您包上金光闪闪的礼盒了！还需要点什么？' },
    { keys: ['钻石', '珠宝', '钻戒'], reply: '钻石已为您装上黑丝绒礼盒，闪到隔壁街都看得见！先生您还要看看蓝宝石吗？' },
    { keys: ['飞机', '私人飞机', '游艇'], reply: '好的先生，私人飞机和游艇都安排好了！您这是要过上海天盛筵的节奏，明天即可交付。' },
    { keys: ['车', '法拉利', '劳斯莱斯', '兰博基尼'], reply: '豪车钥匙已双手奉上，全球限量版，全球只有您能这么随便买下！' },
    { keys: ['岛', '别墅', '豪宅'], reply: '整座岛和海边豪宅已划入您名下，明天就可以开直升机去视察！' },
    { keys: ['买下', '商城', '店'], reply: '您稍等，我去请示一下董事长……董事长说"卖！"恭喜您，您现在是我们商城的新主人了！' },
  ],
  npcDefault: '好的先生，给您。您要的{item}已安排上金光闪闪的礼盒。还需要点什么吗？',

  // 许愿天使回复
  angelReplies: [
    '你的愿望我收到了，但我现在忙着撸猫，晚点再说。',
    '我代表月亮批准了你的愿望，但你要先完成今日穿搭任务。',
    '你的愿望很美，但我只是个无聊的NPC，我帮你转达给宇宙。',
    '收到！正在派送中，预计30个世纪后送达，请耐心等待。',
    '已读。这条愿望已被一只路过的橘猫踩在脚下。',
    '你的愿望触发了系统防御，已被归类为"想太多"文件夹。',
    '许愿成功！作为回报，请明天穿红色袜子出门。',
    '我帮你记下了，等我有空了就去办，大概下辈子吧。',
  ],

  // 盲盒奖品
  blindboxPrizes: [
    { icon: '🚗', name: '一台奔驰', rare: true },
    { icon: '💎', name: '一颗钻石', rare: true },
    { icon: '🐱', name: '一只会写诗的猫', rare: false },
    { icon: '🍔', name: '一个虚拟汉堡', rare: false },
    { icon: '🌟', name: '一种好心情', rare: false },
    { icon: '✈️', name: '一张环球机票', rare: true },
    { icon: '🎁', name: '一个愿望', rare: false },
    { icon: '🧦', name: '一只红色袜子', rare: false },
  ],

  // 彩票
  lotteryPrizes: [
    { amount: '5,000,000', text: '恭喜你中了五百万！' },
    { amount: '10,000,000', text: '恭喜你中了一千万！' },
    { amount: '500,000', text: '恭喜你中了五十万！' },
    { amount: '1,000,000', text: '恭喜你中了一百万！' },
    { amount: '8,888,888', text: '恭喜你中了大吉大利奖！' },
  ],

  // 马拉松
  marathon: {
    runners: [
      { name: '跑者A', avatar: '🏃', dist: 0 },
      { name: '跑者B', avatar: '🚶', dist: 0 },
      { name: '我', avatar: '🐱', dist: 0, me: true },
    ],
    messages: [
      { user: '跑者A', text: '我跑了2公里了', time: '刚刚' },
      { user: '跑者B', text: '加油！还有8公里', time: '30秒前' },
    ]
  },

  // 剧场
  plays: [
    {
      title: '还珠格格之无聊版',
      roles: [
        { name: '紫薇', type: 'npc', avatar: '👸' },
        { name: '尔康', type: 'npc', avatar: '🤴' },
        { name: '小燕子', type: 'open', avatar: '🐦' },
        { name: '皇上', type: 'open', avatar: '👑' },
      ],
      signedUp: 3, audience: 12, tips: 58,
      dialogs: [
        { role: '紫薇', type: 'npc', text: '尔康，你在哪里？我看不见你了！' },
        { role: '尔康', type: 'npc', text: '紫薇，我在这里！山无棱天地合，才敢与君绝！' },
      ]
    },
    {
      title: '甄嬛传之翻白眼大赛',
      roles: [
        { name: '甄嬛', type: 'open', avatar: '💃' },
        { name: '华妃', type: 'npc', avatar: '😤' },
      ],
      signedUp: 1, audience: 8, tips: 23,
      dialogs: [
        { role: '华妃', type: 'npc', text: '贱人就是矫情！' },
      ]
    },
  ],

  // 高考
  gaokao: {
    subjects: [
      { name: '语文', done: true, score: 85 },
      { name: '数学', done: true, score: 92 },
      { name: '英语', done: true, score: 78 },
    ],
    total: 255, rank: 3,
    parents: 8, students: 15,
  },

  // ===== 选择困难症 · 全新数据 =====

  // 12星座今日穿搭：颜色 + 款式 + 详细理由
  zodiacOutfits: {
    '白羊座': { color: '红色', colorIco: '🔴', style: '红色运动卫衣 + 黑色束脚裤 + 老爹鞋', reason: '白羊座今日火星守护能量爆棚，红色是你本命色，能放大你的冲劲和领导力。今日宜主动出击，穿红色会让你在人群中格外醒目，谈事情更容易成。建议搭配一条银色项链增添锐利感。鞋选老爹鞋，方便随时起跑。' },
    '金牛座': { color: '橄榄绿', colorIco: '🟢', style: '橄榄绿西装外套 + 米白T恤 + 卡其阔腿裤', reason: '金牛座今日金星入财帛宫，绿色系对应你的稳定能量，助你冷静判断投资和消费。橄榄绿比纯绿更显沉稳，西装外套提升信任感，今天谈钱的事情穿它最合适。配一条简约皮带，质感胜过logo。' },
    '双子座': { color: '柠檬黄', colorIco: '🟡', style: '柠檬黄针织短袖 + 浅蓝直筒牛仔裤 + 白色帆布鞋', reason: '双子座今日水星活跃度爆表，黄色能放大你的表达欲和社交魅力。今日宜见朋友、谈合作，柠檬黄显白又不浮夸，不会让你显得用力过猛。牛仔裤中和了黄色的跳脱，整体活泼但有分寸。' },
    '巨蟹座': { color: '雾霾蓝', colorIco: '🔵', style: '雾霾蓝oversized衬衫 + 白色吊带 + 米色半裙', reason: '巨蟹座今日月亮入家庭宫，蓝色系给你安全感。雾霾蓝比纯蓝更温柔，呼应你今日想宅家的心情但又不得不出门的矛盾。oversized衬衫像被拥抱，半裙增添柔和感。今天容易遇到旧友，这身搭配恰到好处。' },
    '狮子座': { color: '正红色', colorIco: '🔴', style: '正红色西装外套 + 黑色高领 + 黑色西裤', reason: '狮子座今日太阳拱木星，是大出风头的好日子。正红色西装让你气场全开，今天无论开会还是赴约，你都是C位。黑色内搭压住红色的躁动，整体有力量但不浮夸。建议戴一块金表，财运加倍。' },
    '处女座': { color: '燕麦色', colorIco: '⚪', style: '燕麦色针织开衫 + 白T + 灰色西裤', reason: '处女座今日水星入分析宫，需要清爽不混乱的穿搭维持思路清晰。燕麦色比米色更高级，比灰色更温暖，符合你今日追求完美又不张扬的心情。开衫方便随时增减，应对你今日多变的体感温度。' },
    '天秤座': { color: '粉色', colorIco: '🌸', style: '藕粉色针织开衫 + 白色吊带裙 + 米色单鞋', reason: '天秤座今日金星入爱情宫，粉色是你的桃花色，今日单身的天秤穿粉色容易遇到心动的人，有伴的穿粉色能让关系更甜。藕粉比亮粉更显气质不显幼稚，针织开衫温柔加分。建议喷一点玫瑰香水，魅力翻倍。' },
    '天蝎座': { color: '酒红色', colorIco: '🔴', style: '酒红色丝绒上衣 + 黑色高腰裤 + 黑色短靴', reason: '天蝎座今日冥王星入转变宫，酒红色是你今日的守护色，深邃又神秘，呼应你内心的洞察力。丝绒材质增添高级感，黑色裤子拉长比例。今天适合深谈、签约、表白，这身搭配让对方被你的气场吸引。' },
    '射手座': { color: '橘色', colorIco: '🟠', style: '橘色卫衣 + 卡其工装裤 + 白色运动鞋', reason: '射手座今日木星入冒险宫，橘色激发你的探索欲。今天宜出门、宜旅行、宜尝试新事物，橘色让你保持兴奋又不会过于躁动。工装裤实用又帅气，方便你随时坐下、跳跃、出发。建议背个双肩包，随时上路。' },
    '摩羯座': { color: '深灰色', colorIco: '⚫', style: '深灰色双排扣大衣 + 黑色高领 + 黑色直筒裤', reason: '摩羯座今日土星入事业宫，深灰色是权力色，让你在职场显得可靠专业。今日宜汇报、宜谈判、宜见重要客户，深灰色比黑色更柔和但同样有分量。双排扣设计增添正式感，高领保暖又显瘦。' },
    '水瓶座': { color: '电光蓝', colorIco: '🔵', style: '电光蓝卫衣 + 银色百褶裙 + 黑色马丁靴', reason: '水瓶座今日天王星入创新宫，电光蓝是你今日的灵感色，能放大你的脑洞和创造力。今天适合做创意工作、写东西、和别人讨论新点子。银色百褶裙增添未来感，马丁靴压住整体的跳脱，又有个性又不失态度。' },
    '双鱼座': { color: '薰衣草紫', colorIco: '🟣', style: '薰衣草紫针织裙 + 米白色外套 + 白色单鞋', reason: '双鱼座今日海王星入梦境宫，紫色是你的灵感色，今日容易做重要的梦或收到直觉信号。薰衣草紫比深紫更柔和，不会让你显得过于沉溺。针织裙舒适贴合，米白色外套增添现实感。今天适合写日记、画画、约会。' },
  },

  // 时段饮食推荐 - 每个时段多套推荐，根据星座轮换
  mealResults: {
    '早餐': [
      { food: '豆浆油条 + 茶叶蛋', drink: '热豆浆', reason: '早晨需要温热食物唤醒身体，豆浆补充植物蛋白，油条提供碳水，温润的食物助你一天顺遂。', nearby: ['巷口早餐铺','社区豆浆店','家门口便利店'] },
      { food: '小笼包 + 小米粥', drink: '热牛奶', reason: '小笼包含优质蛋白，小米粥养胃，需要暖胃的食物维持专注力。', nearby: ['老字号包子铺','街角粥店','早餐推车'] },
      { food: '肠粉 + 皮蛋瘦肉粥', drink: '柠檬蜂蜜水', reason: '肠粉清淡易消化，皮蛋瘦肉粥补盐分，今日宜吃广式早茶风格的早餐。', nearby: ['广式肠粉摊','粥粉店','市场早餐档'] },
    ],
    '午餐': [
      { food: '黄焖鸡米饭', drink: '冰可乐', reason: '中午需要碳水补充能量，黄焖鸡的辣味刺激多巴胺分泌，让你下午精神倍增。', nearby: ['写字楼食堂','商场美食街','外卖黄焖鸡'] },
      { food: '麻辣烫 + 米饭', drink: '酸梅汤', reason: '麻辣烫蔬菜多样，营养均衡，酸梅汤解辣又解腻。今日宜吃辣，能帮你释放压力。', nearby: ['街边麻辣烫','商场小吃层','自选麻辣烫'] },
      { food: '兰州拉面 + 卤蛋', drink: '热面汤', reason: '拉面碳水充足，卤蛋补充蛋白质，热面汤暖胃。温热食物最适合今天的胃。', nearby: ['兰州拉面馆','牛肉面馆','街边面馆'] },
    ],
    '晚餐': [
      { food: '番茄火锅 + 肥牛毛肚', drink: '热柠檬红茶', reason: '晚上吃暖色食物能稳定情绪。番茄锅酸甜开胃，搭配肥牛毛肚营养均衡。', nearby: ['社区火锅店','街边老火锅','商场火锅区'] },
      { food: '麻辣香锅 + 米饭', drink: '冰镇酸梅汤', reason: '麻辣香锅香辣下饭，酸梅汤解腻。今晚适合来一顿有锅气的。', nearby: ['麻辣香锅店','干锅店','美食广场'] },
      { food: '家常炒菜 + 紫菜蛋花汤', drink: '玉米汁', reason: '家常菜最治愈，玉米汁清甜暖胃。今晚宜吃得舒服不油腻。', nearby: ['家常菜馆','大排档','社区小炒'] },
    ],
    '夜宵': [
      { food: '烤串 + 小龙虾', drink: '冰啤酒', reason: '夜宵时间到了，烤串配小龙虾是经典组合。放纵一下也没关系，但别喝太多影响明天。', nearby: ['楼下烧烤摊','夜市大排档','家门口烤串'] },
      { food: '麻辣烫', drink: '酸梅汤', reason: '深夜来一碗麻辣烫，热乎又解馋。适合和朋友边吃边聊，缓解一天的疲劳。', nearby: ['24小时麻辣烫','深夜小吃摊','外卖夜宵'] },
      { food: '泡面 + 卤蛋 + 火腿肠', drink: '可乐', reason: '在家吃泡面也是一种夜宵哲学，简单快乐。怀旧食物能给你安全感。', nearby: ['便利店','小卖部','自家厨房'] },
    ],
  },

  // 饮品推荐 - 按时段与餐别独立
  drinkResults: {
    '早餐': [
      { name: '热豆浆', reason: '早晨暖胃，植物蛋白开启一天。' },
      { name: '热牛奶', reason: '温和补钙，适合空腹来一杯。' },
      { name: '柠檬蜂蜜水', reason: '温和清肠，唤醒迟钝的肠胃。' },
    ],
    '午餐': [
      { name: '冰可乐', reason: '中午需要气泡刺激一下多巴胺。' },
      { name: '酸梅汤', reason: '解腻又开胃，配正餐刚好。' },
      { name: '热面汤', reason: '温热顺口，胃里踏实。' },
    ],
    '晚餐': [
      { name: '热柠檬红茶', reason: '晚上喝点暖的，情绪稳定。' },
      { name: '冰镇酸梅汤', reason: '解辣解腻，吃完晚饭不发胀。' },
      { name: '玉米汁', reason: '清甜暖胃，晚餐喝不腻。' },
    ],
    '夜宵': [
      { name: '冰啤酒', reason: '夜宵标配，但别喝多。' },
      { name: '酸梅汤', reason: '解馋又解渴，深夜友好。' },
      { name: '可乐', reason: '快乐水配夜宵，简单直接。' },
    ],
  },

  // 美妆
  makeupResults: {
    lipstick: '暖调正红色',
    nail: '酒红色 + 金色细闪',
    eyeshadow: '大地色 + 玫瑰金',
    reason: '红色系是你的今日幸运色，暖调妆容助你人际关系顺畅。',
  },

  // 去哪儿 - 5个问题（超能力向）
  travelQuestions: [
    { id: 'time', q: '如果可以随意穿梭时空，你最想回到哪一段时光？', opts: ['童年夏天', '盛唐长安', '80年代街头', '未来太空城'] },
    { id: 'animal', q: '如果能和任意一种动物无障碍对话，你会选择哪种动物？', opts: ['猫', '狗', '海豚', '老鹰'] },
    { id: 'heal', q: '如果拥有瞬间治愈所有伤痛的能力，你会优先帮助谁？', opts: ['疲惫的陌生人', '流浪动物', '远方的亲人', '自己'] },
    { id: 'power', q: '如果能拥有一种超能力，你会选什么？', opts: ['隐身', '飞行', '读心', '时间暂停'] },
    { id: 'weather', q: '如果能自由操控天气，你最想改造哪一种气候？', opts: ['把雨天变晴天', '让沙漠下雪', '给夏天降温', '让极光天天见'] },
  ],

  // 旅游目的地 + 攻略 - 根据答案组合推荐
  travelDestinations: [
    { dest: '大理', budget: '3000-4000元（3天2晚）', reason: '洱海慢生活适合放空，文艺气息浓，适合想治愈自己或陪伴恋人的人。', guide: '【3天2晚攻略】Day1：抵达→大理古城闲逛→人民路吃饵丝→夜游洋人街。Day2：环洱海骑行（建议租电瓶车）→双廊古镇→喜洲粑粑→海舌公园看日落。Day3：苍山感通索道→寂照庵吃素斋→返程。必备：防晒霜、墨镜、薄外套（早晚温差大）。' },
    { dest: '成都', budget: '2000-3000元（3天2晚）', reason: '美食天堂，节奏慢，适合爱吃爱躺平的你，也适合和闺蜜/兄弟一起逛吃。', guide: '【3天2晚攻略】Day1：宽窄巷子→人民公园喝茶→春熙路太古里→晚上吃火锅。Day2：熊猫基地（早去！）→锦里→武侯祠→九眼桥酒吧街。Day3：都江堰一日游→晚上吃串串香→返程。必备：胃口、健胃消食片。' },
    { dest: '三亚', budget: '5000-7000元（4天3晚）', reason: '阳光海滩适合放松，热带风情治愈，适合想逃离日常、拥抱大海的你。', guide: '【4天3晚攻略】Day1：抵达→亚龙湾酒店check in→海边日落。Day2：蜈支洲岛一日游（提前订票）→潜水→晚上亚龙湾夜市。Day3：南山寺→天涯海角→椰梦长廊。Day4：免税店购物→返程。必备：防晒（SPF50+）、泳衣、拖鞋。' },
    { dest: '西安', budget: '2000-3000元（3天2晚）', reason: '穿越感最强的城市，盛唐长安的遗迹让你一秒回到历史现场。', guide: '【3天2晚攻略】Day1：兵马俑→华清宫→回民街吃羊肉泡馍。Day2：陕西历史博物馆→大雁塔→大唐不夜城。Day3：古城墙骑行→永兴坊→返程。必备：好走的鞋、空肚子、汉服（可选）。' },
    { dest: '西藏', budget: '6000-9000元（5天4晚）', reason: '净化心灵，雪山圣湖适合深度体验，适合拥有超能力幻想、想远离喧嚣的你。', guide: '【5天4晚攻略】Day1：抵达拉萨→适应高原→八廓街闲逛。Day2：布达拉宫（提前预约！）→大昭寺→玛吉阿米。Day3：纳木错一日游。Day4：羊卓雍措→卡若拉冰川。Day5：买特产→返程。必备：红景天、厚外套、身份证、慢动作。' },
    { dest: '青岛', budget: '2000-3000元（3天2晚）', reason: '海边城市，啤酒海鲜，适合夏天去，也适合想“给夏天降温”的你。', guide: '【3天2晚攻略】Day1：栈桥→海军博物馆→小鱼山→晚上啤酒街。Day2：八大关→第二海水浴场→五四广场→奥帆中心。Day3：崂山一日游→返程。必备：防晒、胃口、好喝的啤酒。' },
    { dest: '呼伦贝尔', budget: '4000-6000元（4天3晚）', reason: '大草原辽阔自由，适合想变成老鹰翱翔、或者和动物对话的你。', guide: '【4天3晚攻略】Day1：抵达海拉尔→莫日格勒河→额尔古纳湿地。Day2：白桦林→恩和俄罗斯民族乡。Day3：黑山头骑马→边防公路→满洲里。Day4：呼伦湖→返程。必备：外套、驱蚊水、无人机。' },
    { dest: '敦煌', budget: '3000-5000元（4天3晚）', reason: '沙漠、星空、壁画，适合想让沙漠下雪或天天看极光的幻想家。', guide: '【4天3晚攻略】Day1：莫高窟→鸣沙山月牙泉→沙洲夜市。Day2：阳关→玉门关→雅丹魔鬼城。Day3：榆林窟→锁阳城。Day4：返程。必备：防晒、头巾、厚外套（昼夜温差大）。' },
  ],

  // 骰子随机入口
  diceEntries: [
    { name: '穿搭推荐', target: 'select-outfit', icon: '👔' },
    { name: '无聊火锅', target: 'park-hotpot', icon: '🍲' },
    { name: '云许愿', target: 'park-wish', icon: '🌟' },
    { name: '无聊广场', target: 'square', icon: '🏛️' },
    { name: '无聊挑战', target: 'square-challenge', icon: '⚡' },
    { name: '吹牛商城', target: 'park-shop', icon: '🛍️' },
    { name: '拆盲盒', target: 'park-blindbox', icon: '🎁' },
    { name: '买彩票', target: 'park-lottery', icon: '🎰' },
  ],

  // 乐园 - 随时可进
  parkAnytime: [
    { id: 'hotpot', name: '无聊火锅店', icon: '🍲', desc: '大锅加料，越煮越满', color: 'var(--red)' },
    { id: 'shop', name: '吹牛商城', icon: '🛍️', desc: '奢侈品随便买', color: 'var(--grape)' },
    { id: 'wish', name: '云许愿', icon: '🌟', desc: '抛向天空，天使回复', color: 'var(--sky)' },
    { id: 'blindbox', name: '无聊盲盒', icon: '🎁', desc: '线上拆，恭喜拆到奔驰', color: 'var(--pink)' },
    { id: 'lottery', name: '无聊彩票站', icon: '🎰', desc: '买的人全中奖', color: 'var(--mustard)' },
    { id: 'plane', name: '无聊飞机', icon: '✈️', desc: '漂流瓶传递', color: 'var(--mint)' },
    { id: 'diet', name: '无聊减肥', icon: '🏃', desc: '今日跑了十公里', color: 'var(--mint)' },
    { id: 'cat', name: '云撸猫', icon: '🐱', desc: '点猫换表情', color: 'var(--pink)' },
  ],
  // 乐园 - 定点开放
  parkScheduled: [
    { id: 'marathon', name: '无聊马拉松', icon: '🏃', desc: '报名→发令枪→颁奖', time: '1分钟后开跑', color: 'var(--sky)' },
    { id: 'theater', name: '无聊剧场', icon: '🎬', desc: '演戏/看戏/打赏', time: '演出中', color: 'var(--grape)' },
    { id: 'gaokao', name: '无聊高考', icon: '📚', desc: '考生/父母角色', time: '晚8点集合', color: 'var(--red)' },
    { id: 'rich', name: '无聊富豪', icon: '💎', desc: '大哥大姐带小弟小妹消费', time: '随时', color: 'var(--mustard)' },
    { id: 'love', name: '无聊恋爱', icon: '💕', desc: '女神/帅哥/舔狗互动', time: '随时', color: 'var(--pink)' },
  ],

  // 无聊恋爱 · 角色预设
  lovePresets: {
    goddess: ['……有事？','在忙','哦','嗯','别发了我看到了','随便你','别烦我','已读不回'],
    licker: ['女神说什么都对！','我给你买奶茶吧~','在吗？吃了吗？','女神回我了！','我可以一直等','你今天真好看','我请你吃饭好不好','女神晚安'],
    handsome: ['嗨～今天想我了吗？','你真可爱~','永远在一起！','晚点见','想你了','今天也喜欢你','么么哒💋','你是我最特别的人'],
    'licker-girl': ['帅哥在干嘛~','我请你喝奶茶','你今天好帅','可以理我一下吗','我等你回复','你在忙吗？','帅哥晚安','你笑一下我心动了'],
  },
  loveReplies: {
    // 当用户扮演女神/帅哥时，对方（舔狗/舔狗妹）的回复
    toPopular: ['女神/帅哥说什么都对！','我立马到！','收到！','你理我了！我截图保存','我请你喝奶茶','好的好的都听你的'],
    // 当用户扮演舔狗/舔狗妹时，对方（女神/帅哥）的回复
    toLicker: ['哦','嗯','在忙','别发了我看到了','随便你','好吧','(已读不回)','有事？'],
  },

  // 纯爱模式 · 角色预设
  lovePresetsPure: {
    goddess: ['你今天也很可爱','谢谢你的关心','和你聊天很开心','你也要早点休息','今天有想我吗？','你真的很温柔','好呀','嗯嗯'],
    licker: ['我会一直陪着你','你开心我就开心','今天也要加油哦','记得按时吃饭','你特别好','我会努力变得更好','晚安，做个好梦','想你了'],
    handsome: ['你今天真好看','我会一直在你身边','想和你一起散步','你笑的时候特别甜','我们要一直在一起','今天也想见到你','抱抱','爱你'],
    'licker-girl': ['你今天累不累','我会默默支持你','你真的很优秀','想和你分享今天的事','你要照顾好自己','我会一直喜欢你','晚安','想你了'],
  },
  loveRepliesPure: {
    toPopular: ['你最好了','有你在真好','我也想你了','谢谢你一直陪着我','抱抱','好呀，都听你的'],
    toLicker: ['你也很可爱','你也是我的宝藏','谢谢你','有你真好','我会一直陪着你','你也是'],
  },

  // 漂流瓶
  planeBottle: {
    topic: '如果你有3000亿，但必须用鼻子吃完一碗面，你吃吗？',
    records: [
      { user: '匿名A', text: '吃！3000亿够我请100个喂我吃面的人' },
      { user: '匿名B', text: '不吃，我要留3000亿，用面盖一座金字塔' },
      { user: '匿名C', text: '我吃面，但我要求面是金子做的' },
    ]
  },

};

// 把 DATA 暴露到全局
window.DATA = DATA;
