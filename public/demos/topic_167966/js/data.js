const mockData = {
  activities: [
    {
      id: '1',
      title: '首届 Vibe Coding 创意大赛 🚀',
      coverEmoji: '💻',
      images: ['💻', '🎨', '🏆', '✨'],
      category: '竞赛',
      host: { id: 'u1', name: 'TechHub 社区', avatarEmoji: '🤖', isVerified: true },
      location: '中关村创业大街 3号楼',
      distance: '2.1km',
      date: '2026-07-20',
      startTime: '09:00',
      endTime: '18:00',
      fee: 0,
      description: '用 AI 辅助编程，3小时完成一个创意作品！不限语言不限框架，评委现场打分。优胜者将获得机械键盘+云服务器年卡。带上你的脑洞来！',
      maxParticipants: 50,
      currentParticipants: 38,
      participants: [
        { id: 'p1', name: '码农小王', emoji: '👨‍💻' },
        { id: 'p2', name: 'AI女孩', emoji: '👩‍💻' },
        { id: 'p3', name: '全栈老李', emoji: '🧑‍💻' },
        { id: 'p4', name: '设计喵', emoji: '🐱' },
        { id: 'p5', name: '产品经理', emoji: '📱' }
      ],
      tags: ['VibeCoding', 'AI', '编程'],
      isJoined: false
    },
    {
      id: '2',
      title: '迪士尼找搭子！本周六冲 🏰',
      coverEmoji: '🎠',
      images: ['🏰', '🎢', '🎆', '🧸'],
      category: '社交',
      host: { id: 'u2', name: '快乐小狗', avatarEmoji: '🐶', isVerified: true },
      location: '上海迪士尼乐园',
      distance: '15km',
      date: '2026-07-19',
      startTime: '08:30',
      endTime: '21:00',
      fee: 475,
      description: '一个人去迪士尼太孤单啦！找2-3个搭子一起刷项目、拍美照、看烟花。已有年卡，可以带你们走快速通道~ 性格随和的来！',
      maxParticipants: 4,
      currentParticipants: 2,
      participants: [
        { id: 'p6', name: '甜甜', emoji: '🍬' },
        { id: 'p7', name: '萌萌', emoji: '🐰' }
      ],
      tags: ['迪士尼', '找搭子', '拍照'],
      isJoined: false
    },
    {
      id: '3',
      title: '黑客松大赛·找靠谱队友 🔥',
      coverEmoji: '⚡',
      images: ['⚡', '🔧', '📡', '🏅'],
      category: '竞赛',
      host: { id: 'u3', name: '极客公园', avatarEmoji: '🔥', isVerified: true },
      location: '望京 SOHO T3',
      distance: '5.6km',
      date: '2026-07-26',
      startTime: '09:00',
      endTime: '07-27 12:00',
      fee: 0,
      description: '48小时黑客松，主题「AI for Good」。缺前端和设计师！已有后端+算法，奖金池 10w。提供住宿和无限量零食。来就完了！',
      maxParticipants: 5,
      currentParticipants: 3,
      participants: [
        { id: 'p8', name: '后端大佬', emoji: '🧑‍💻' },
        { id: 'p9', name: '算法工程师', emoji: '🧠' },
        { id: 'p10', name: 'PM', emoji: '📋' }
      ],
      tags: ['黑客松', 'AI', '组队'],
      isJoined: false
    },
    {
      id: '4',
      title: 'AI 绘画工作坊 · 零基础入门 🎨',
      coverEmoji: '🖼️',
      images: ['🖼️', '🤖', '✨', '🌸'],
      category: 'AI',
      host: { id: 'u4', name: '创意实验室', avatarEmoji: '🎨', isVerified: true },
      location: '798艺术区 D区',
      distance: '8.2km',
      date: '2026-07-22',
      startTime: '14:00',
      endTime: '17:00',
      fee: 128,
      description: 'Midjourney + Stable Diffusion 实操教学，手把手教你用 AI 画出超美作品。自带笔记本，现场提供账号体验。适合完全零基础！',
      maxParticipants: 15,
      currentParticipants: 11,
      participants: [
        { id: 'p11', name: '小白', emoji: '🐣' },
        { id: 'p12', name: '插画师', emoji: '👩‍🎨' },
        { id: 'p13', name: '摄影师', emoji: '📷' }
      ],
      tags: ['AI绘画', 'Midjourney', '艺术'],
      isJoined: false
    },
    {
      id: '5',
      title: '科普讲座：量子计算入门 🔬',
      coverEmoji: '⚛️',
      images: ['⚛️', '🔭', '📊', '💡'],
      category: '科普',
      host: { id: 'u5', name: '中科院科普团', avatarEmoji: '🔬', isVerified: true },
      location: '清华大学科学馆',
      distance: '12km',
      date: '2026-07-24',
      startTime: '19:00',
      endTime: '21:00',
      fee: 0,
      description: '中科院研究员亲授，用大白话讲清楚量子计算原理。现场有量子计算机模拟演示，还能上手操作！科学爱好者必来。',
      maxParticipants: 80,
      currentParticipants: 62,
      participants: [
        { id: 'p14', name: '物理迷', emoji: '🧑‍🔬' },
        { id: 'p15', name: '学生党', emoji: '📚' },
        { id: 'p16', name: '科技博主', emoji: '📺' }
      ],
      tags: ['科普', '量子计算', '讲座'],
      isJoined: false
    },
    {
      id: '6',
      title: '周末羽毛球双打局 🏸',
      coverEmoji: '🏸',
      images: ['🏸', '🏃', '🤝', '🎉'],
      category: '运动',
      host: { id: 'u6', name: '小明同学', avatarEmoji: '👨', isVerified: true },
      location: '朝阳体育中心羽毛球馆',
      distance: '1.2km',
      date: '2026-07-18',
      startTime: '14:00',
      endTime: '16:00',
      fee: 30,
      description: '周六下午羽毛球双打，水平中等偏上，欢迎喜欢打球的朋友一起！场地已经订好，拍子自带，球我们提供。打完可以一起去吃火锅~',
      maxParticipants: 8,
      currentParticipants: 5,
      participants: [
        { id: 'p17', name: '小王', emoji: '🧑' },
        { id: 'p18', name: '阿花', emoji: '👩' },
        { id: 'p19', name: '老李', emoji: '👨' },
        { id: 'p20', name: '小美', emoji: '👧' },
        { id: 'p21', name: '大刘', emoji: '🧔' }
      ],
      tags: ['羽毛球', '运动', '双打'],
      isJoined: true
    },
    {
      id: '7',
      title: '新晋网红咖啡店探店打卡 ☕',
      coverEmoji: '☕',
      images: ['☕', '🍰', '📸', '✨'],
      category: '美食',
      host: { id: 'u7', name: '探店达人Lisa', avatarEmoji: '👩', isVerified: true },
      location: '三里屯太古里北区',
      distance: '2.5km',
      date: '2026-07-17',
      startTime: '10:30',
      endTime: '12:30',
      fee: 0,
      description: '发现一家超有氛围感的咖啡店，工业风装修，拍照巨出片！咖啡师是世界冠军，手冲超赞。想找几个喜欢拍照喝咖啡的朋友一起探店，AA制~',
      maxParticipants: 6,
      currentParticipants: 4,
      participants: [
        { id: 'p22', name: '琪琪', emoji: '👩' },
        { id: 'p23', name: '晓晓', emoji: '👧' },
        { id: 'p24', name: '甜甜', emoji: '👩' },
        { id: 'p25', name: '萌萌', emoji: '👧' }
      ],
      tags: ['咖啡', '探店', '拍照'],
      isJoined: false
    },
    {
      id: '8',
      title: '现代艺术展 · 光与空间 🎨',
      coverEmoji: '🎨',
      images: ['🎨', '🖼️', '✨', '📷'],
      category: '展览',
      host: { id: 'u8', name: '艺术爱好者', avatarEmoji: '🧑', isVerified: true },
      location: '798艺术区UCCA',
      distance: '3.8km',
      date: '2026-07-20',
      startTime: '14:00',
      endTime: '17:00',
      fee: 80,
      description: '超火的沉浸式艺术展，利用光影创造出梦幻空间，适合喜欢艺术和拍照的朋友。我已经买好票了，想找几个同好一起看展交流，看完可以附近吃晚饭。',
      maxParticipants: 10,
      currentParticipants: 7,
      participants: [
        { id: 'p26', name: '艺术君', emoji: '🧑' },
        { id: 'p27', name: '画手', emoji: '👩' },
        { id: 'p28', name: '设计师', emoji: '🧑' },
        { id: 'p29', name: '小美工', emoji: '👧' },
        { id: 'p30', name: '文艺青年', emoji: '🧑' }
      ],
      tags: ['展览', '艺术', '798'],
      isJoined: false
    }
  ],

  hotRankings: [
    {
      rank: 1, title: '迪士尼找搭子当天就凑齐四人，烟火位绝了', heat: '4823', tag: 'fire', change: 'up', emoji: '🏰', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', location: '上海迪士尼',
      author: { name: '甜甜', avatar: '🍬' },
      content: '周六临时起意想去迪士尼，在Join上发了找搭子帖，没想到当天就凑齐了四人！大家都超nice，一起刷项目、拍美照、看烟花。C位的烟火真的绝了，感谢姐妹们陪我疯一整天~ 已经约好下周继续！',
      images: ['🎡', '🎆', '🧸', '📸'],
      tags: ['迪士尼', '找搭子', '拍照'],
      comments: [
        { name: '萌萌', avatar: '🐰', text: '好羡慕！下次带我一个', time: '2小时前' },
        { name: '快乐小狗', avatar: '🐶', text: '烟火位确实绝，我上次去也拍到了', time: '3小时前' },
        { name: '琪琪', avatar: '🦊', text: '求拉群！下次一起冲', time: '5小时前' }
      ]
    },
    {
      rank: 2, title: '夜跑奥森遇见一群神仙跑友，下周已经约好', heat: '3920', tag: 'hot', change: 'up', emoji: '🏃', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', location: '奥森公园',
      author: { name: '跑腿小达人', avatar: '🏃' },
      content: '一个人去奥森夜跑，配速不太稳定，结果遇到一群跑友主动带我。全程有人领跑有人收尾，5公里跑下来一点都不累。跑完还一起拉伸、喝电解质水，氛围太好了。下周三老时间老地点，已经约好了！',
      images: ['🌙', '🏃', '🥤', '⭐'],
      tags: ['夜跑', '奥森', '跑友'],
      comments: [
        { name: '大刘', avatar: '🧔', text: '那天我也在！带你的就是我', time: '1小时前' },
        { name: '小美', avatar: '👧', text: '求带！我配速6分半能跟上吗', time: '2小时前' }
      ]
    },
    {
      rank: 3, title: 'Vibe Coding 组队熬通宵，陌生队友变兄弟', heat: '3567', tag: 'hot', change: 'up', emoji: '🔥', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', location: '线上·vibecoding.join.com', isOnline: true, website: 'vibecoding.join.com',
      author: { name: '码农小王', avatar: '👨‍💻' },
      content: 'Vibe Coding大赛现场临时组队，三个完全陌生的人，3小时从0做出一个AI小工具拿了优胜奖。熬通宵的过程太上头了，分工明确、配合默契，赛后直接去撸串庆祝。从陌生队友变成兄弟，就差一次通宵。报名网站 vibecoding.join.com',
      images: ['💻', '🏆', '🍺', '✨'],
      tags: ['VibeCoding', 'AI', '组队'],
      comments: [
        { name: 'AI女孩', avatar: '👩‍💻', text: '那天带你飞的就是我哈哈', time: '30分钟前' },
        { name: '全栈老李', avatar: '🧑‍💻', text: '下次黑客松继续一起！', time: '1小时前' }
      ]
    },
    {
      rank: 4, title: '黑客松临时凑的队拿了一等奖，缘分啊', heat: '2981', tag: 'fire', change: 'new', emoji: '🏆', gradient: 'linear-gradient(135deg, #f97316, #fbbf24)', location: '望京SOHO',
      author: { name: '后端大佬', avatar: '🧑‍💻' },
      content: '48小时黑客松，开赛前半小时队伍还缺前端和设计师。在Join上发了求组队帖，5分钟内就有人响应。最后临时凑的队伍居然拿了一等奖，奖金5万分到手。赛后复盘发现分工配合比那些老队伍还默契，缘分来了挡都挡不住。',
      images: ['⚡', '🏅', '💰', '🤝'],
      tags: ['黑客松', 'AI for Good', '组队'],
      comments: [
        { name: '算法工程师', avatar: '🧠', text: '我是那个临时被拉来的，真香了', time: '4小时前' },
        { name: 'PM', avatar: '📋', text: '下次缺人还来发帖', time: '6小时前' }
      ]
    },
    {
      rank: 5, title: '798逛展搭子太懂了，全程讲解不花钱', heat: '2154', tag: 'new', change: 'up', emoji: '🥰', gradient: 'linear-gradient(135deg, #fa709a, #fee140)', location: '798艺术区',
      author: { name: '小白', avatar: '🐣' },
      content: '一个人去798看展有点无聊，在Join上约了个搭子。结果对方是艺术史研究生，全程给我讲解每幅画的背景和技法，比请导游还专业！看完展还一起吃了brunch，聊了一下午艺术和摄影。这种高质量社交真的太香了。',
      images: ['🖼️', '🎨', '📷', '🥐'],
      tags: ['798', '看展', '找搭子'],
      comments: [
        { name: '插画师', avatar: '👩‍🎨', text: '那个搭子是我同学哈哈', time: '2小时前' },
        { name: '文艺青年', avatar: '🧑', text: '求搭子！我也想去798', time: '3小时前' }
      ]
    },
    {
      rank: 6, title: '羽毛球双打现场捡了个搭档，技术还贼好', heat: '1872', tag: 'hot', change: 'down', emoji: '🏸', gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)', location: '奥体中心',
      author: { name: '小王', avatar: '🧑' },
      content: '去奥体打球，搭档临时放鸽子。正愁一个人没法打，旁边场有个哥们也在等场地，一拍即合组了双打。配合出奇默契，连赢三局。打完一起吃了火锅，约好下周固定搭档。Join真是运动找搭子神器。',
      images: ['🏸', '🤝', '🍲', '💪'],
      tags: ['羽毛球', '双打', '运动'],
      comments: [
        { name: '阿花', avatar: '👩', text: '那个捡来的搭档是我哥', time: '1小时前' },
        { name: '老李', avatar: '👨', text: '下周还缺人吗带我', time: '2小时前' }
      ]
    },
    {
      rank: 7, title: '周末探店小分队三人组，连刷五家咖啡店', heat: '1568', tag: 'new', change: 'up', emoji: '🤩', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)', location: '三里屯',
      author: { name: '琪琪', avatar: '🦊' },
      content: '周末闲着没事，在Join发了探店帖，凑了三人小分队。从三里屯出发连刷五家咖啡店，每家都点了招牌互相分享。最惊艳的是那家手冲瑰夏，老板还请我们试了新豆。一路聊一路喝，人均才花了80，比一个人去有意思多了。',
      images: ['☕', '🍰', '📸', '🚶'],
      tags: ['探店', '咖啡', '三里屯'],
      comments: [
        { name: '晓晓', avatar: '👧', text: '那家手冲真的绝！', time: '3小时前' },
        { name: '甜甜', avatar: '🍬', text: '求下次探店带上我', time: '5小时前' }
      ]
    },
    {
      rank: 8, title: '狼人杀拼桌认识一群戏精，笑到肚子疼', heat: '1345', tag: 'hot', change: 'up', emoji: '🐺', gradient: 'linear-gradient(135deg, #5f2c82, #49a09d)', location: '五道口',
      author: { name: '戏精本精', avatar: '🎭' },
      content: '周末无聊在Join拼了一桌狼人杀，12个人全是陌生人。结果全员戏精，预言家跳得比真预言家还真，狼人自爆带节奏全场高潮。笑到肚子疼，打到凌晨两点才散。已经建了群每周固定局，从拼桌变固定团就差一局狼人杀。',
      images: ['🐺', '🎭', '😂', '🌙'],
      tags: ['狼人杀', '拼桌', '社交'],
      comments: [
        { name: '预言家', avatar: '🔮', text: '那天我第一轮就被投出去好惨', time: '2小时前' },
        { name: '小美', avatar: '👧', text: '求拉群！我想玩', time: '4小时前' }
      ]
    },
    {
      rank: 9, title: '东京马拉松海外找跑搭子，全程互相打气完赛', heat: '1123', tag: '', change: '', emoji: '🗾', gradient: 'linear-gradient(135deg, #BC8F8F, #A67B7B)', location: '日本·东京',
      author: { name: '跑马老张', avatar: '🧔' },
      content: '报了东京马拉松但一个人去太孤单，在Join上找到同样参赛的跑友。从出发到完赛全程互相打气，30公里撞墙期全靠他拉着我跑。完赛后一起在终点合影、吃拉面庆祝，这趟海外参赛体验拉满。明年波马继续约！',
      images: ['🗾', '🏃', '🍜', '🏅'],
      tags: ['马拉松', '海外', '跑友'],
      comments: [
        { name: '跑友小陈', avatar: '🧑', text: '就是我就是我！明年波马见', time: '6小时前' },
        { name: '大刘', avatar: '🧔', text: '海外找搭子真的太难了，感谢Join', time: '1天前' }
      ]
    },
    {
      rank: 10, title: '剧本车拼到神仙队友，复盘聊到凌晨两点', heat: '986', tag: 'new', change: 'up', emoji: '🎭', gradient: 'linear-gradient(135deg, #a78bfa, #818cf8)', location: '鼓楼东大街',
      author: { name: '剧本杀爱好者', avatar: '🎭' },
      content: '在Join拼了一车剧本杀，本以为是普通局，结果全员沉浸式演技在线。凶手骗了所有人三轮，最后复盘大家越聊越嗨，从剧情聊到人生，直接聊到凌晨两点。从拼车变固定车，现在每周四晚雷打不动开局。',
      images: ['🎭', '📜', '🌙', '🤝'],
      tags: ['剧本杀', '拼车', '社交'],
      comments: [
        { name: 'DM小王', avatar: '🧑', text: '那车我也是玩家，太爽了', time: '3小时前' },
        { name: '小美', avatar: '👧', text: '求上车！新手能玩吗', time: '5小时前' }
      ]
    }
  ],

  messages: [
    {
      id: 'm1',
      type: 'friend',
      title: '小明同学',
      content: '周六羽毛球你还来吗？我带了新拍子',
      avatar: '👨',
      time: '10:30',
      isRead: false,
      unreadCount: 2,
      preview: '周六羽毛球你还来吗？',
      friendId: 'f1'
    },
    {
      id: 'm2',
      type: 'group',
      title: 'TechHub 社区',
      content: '群主共享了日程和待办事项',
      avatar: '🤖',
      time: '昨天',
      isRead: false,
      unreadCount: 5,
      preview: '码农小王: Vibe Coding 大赛明早9点开始',
      sharedSchedule: { title: 'Vibe Coding 创意大赛', time: '09:00', location: '线上·vibecoding.join.com' },
      todos: [
        { id: 't1', text: '带笔记本电脑', done: false },
        { id: 't2', text: '注册参赛账号', done: true },
        { id: 't3', text: '签到打卡', done: false }
      ],
      friendId: 'f2'
    },
    {
      id: 'm3',
      type: 'activity',
      title: '活动提醒：Vibe Coding大赛',
      content: '明天 09:00 中关村创业大街 3号楼',
      coverEmoji: '💻',
      time: '昨天',
      isRead: false
    },
    {
      id: 'm4',
      type: 'friend',
      title: '快乐小狗',
      content: '迪士尼的票我买好啦，周六见！',
      avatar: '🐶',
      time: '昨天',
      isRead: true,
      preview: '迪士尼的票我买好啦',
      friendId: 'f3'
    },
    {
      id: 'm5',
      type: 'achievement',
      title: '恭喜获得「社交达人」徽章',
      content: '你本月已参加5场活动，超过了90%的用户！',
      badge: '🏆',
      time: '2天前',
      isRead: true
    },
    {
      id: 'm6',
      type: 'group',
      title: '极客公园',
      content: '群主共享了日程和待办事项',
      avatar: '🔥',
      time: '3天前',
      isRead: true,
      unreadCount: 0,
      preview: '后端大佬: 黑客松缺前端和设计师，奖金池10w',
      sharedSchedule: { title: '黑客松 AI for Good', time: '09:00', location: '望京SOHO T3' },
      todos: [
        { id: 't4', text: '组队确认', done: false },
        { id: 't5', text: '准备开发环境', done: false }
      ],
      friendId: 'f5'
    },
    {
      id: 'm7',
      type: 'system',
      title: '实名认证审核通过',
      content: '恭喜你已完成实名认证，现在可以报名活动啦',
      time: '4天前',
      isRead: true
    },
    {
      id: 'm8',
      type: 'friend',
      title: '探店达人Lisa',
      content: '下周有新的咖啡店，一起去吗？',
      avatar: '👩',
      time: '5天前',
      isRead: true,
      preview: '下周有新的咖啡店'
    }
  ],

  user: {
    id: 'me',
    name: '小美同学',
    avatarEmoji: '👧',
    isVerified: true,
    creditScore: 95,
    bio: '热爱生活，喜欢探索新鲜事物，找搭子一起玩！',
    region: '北京·朝阳区',
    age: 24,
    interests: ['运动', 'AI', '探店', '找搭子', '羽毛球'],
    stats: {
      joinedCount: 12,
      hostedCount: 3,
      placesCount: 18,
      friendsCount: 26,
      maxStreak: 4
    },
    achievements: [
      { id: 'a1', name: '初来乍到', emoji: '🎯', unlocked: true },
      { id: 'a2', name: '社交达人', emoji: '🏆', unlocked: true },
      { id: 'a3', name: '运动健将', emoji: '💪', unlocked: true },
      { id: 'a4', name: '美食家', emoji: '🍜', unlocked: true },
      { id: 'a5', name: '艺术迷', emoji: '🎨', unlocked: false },
      { id: 'a6', name: '发起者', emoji: '📣', unlocked: true },
      { id: 'a7', name: '连续王', emoji: '🔥', unlocked: false },
      { id: 'a8', name: '百人斩', emoji: '👑', unlocked: false }
    ]
  },

  scheduleActivities: [
    {
      id: 's0a',
      type: 'personal',
      title: '读完《人类简史》第3章',
      date: '2026-07-15',
      time: '09:00',
      shareStatus: 'private',
      notes: '上午专注阅读，做读书笔记',
      tags: ['阅读', '学习'],
      status: 'upcoming'
    },
    {
      id: 's0b',
      type: 'personal',
      title: '完成数据结构作业',
      date: '2026-07-15',
      time: '14:00',
      shareStatus: 'private',
      notes: '红黑树那道题还没写完',
      tags: ['作业', '学习'],
      status: 'upcoming'
    },
    {
      id: 's0c',
      type: 'personal',
      title: '健身房撸铁',
      date: '2026-07-15',
      time: '19:00',
      shareStatus: 'friends',
      notes: '今天练背+二头',
      tags: ['运动', '健身'],
      status: 'upcoming'
    },
    {
      id: 's1',
      type: 'activity',
      activityId: '6',
      title: '周末羽毛球双打局',
      date: '2026-07-18',
      time: '14:00',
      location: '朝阳体育中心羽毛球馆',
      shareStatus: 'friends',
      notes: '自带球拍，穿运动鞋',
      tags: ['运动', '羽毛球'],
      companions: ['小王', '阿花'],
      isPublic: false,
      isRecruiting: false,
      allowComments: true,
      music: '',
      status: 'upcoming'
    },
    {
      id: 's2',
      type: 'activity',
      activityId: '7',
      title: '新晋网红咖啡店探店打卡',
      date: '2026-07-17',
      time: '10:30',
      location: '三里屯太古里北区',
      shareStatus: 'public',
      notes: 'AA制，记得带充电宝',
      tags: ['咖啡', '探店'],
      companions: ['琪琪', '晓晓'],
      isPublic: true,
      isRecruiting: false,
      allowComments: true,
      music: 'Lo-fi Beats',
      status: 'completed'
    },
    {
      id: 's3',
      type: 'activity',
      activityId: '1',
      title: '首届 Vibe Coding 创意大赛',
      date: '2026-07-20',
      time: '09:00',
      location: '中关村创业大街 3号楼',
      shareStatus: 'public',
      notes: '带上电脑和脑洞',
      tags: ['竞赛', '编程'],
      companions: [],
      isPublic: true,
      isRecruiting: true,
      allowComments: true,
      music: '',
      status: 'upcoming'
    },
    {
      id: 's4',
      type: 'activity',
      activityId: '4',
      title: 'AI 绘画工作坊',
      date: '2026-07-22',
      time: '14:00',
      location: '798艺术区 D区',
      shareStatus: 'friends',
      notes: '带笔记本，提前注册账号',
      tags: ['AI', '艺术'],
      companions: ['小白'],
      isPublic: false,
      isRecruiting: false,
      allowComments: true,
      music: '',
      status: 'upcoming'
    },
    {
      id: 's5',
      type: 'activity',
      activityId: '5',
      title: '科普讲座：量子计算入门',
      date: '2026-07-24',
      time: '19:00',
      location: '清华大学科学馆',
      shareStatus: 'public',
      notes: '提前15分钟到场',
      tags: ['科普', '讲座'],
      companions: [],
      isPublic: true,
      isRecruiting: false,
      allowComments: false,
      music: '',
      status: 'upcoming'
    },
    {
      id: 's6',
      type: 'activity',
      activityId: '3',
      title: '黑客松大赛·找靠谱队友',
      date: '2026-07-26',
      time: '09:00',
      location: '望京 SOHO T3',
      shareStatus: 'private',
      notes: '48小时，带洗漱用品',
      tags: ['黑客松', '竞赛'],
      companions: ['后端大佬'],
      isPublic: false,
      isRecruiting: true,
      allowComments: true,
      music: 'Electronic',
      status: 'upcoming'
    }
  ],

  followingItems: [
    {
      id: 'f1',
      name: '小明同学',
      avatarEmoji: '👨',
      action: '发布了新活动',
      activityTitle: '周末羽毛球双打局，高手来！',
      time: '2小时前'
    },
    {
      id: 'f2',
      name: 'TechHub 社区',
      avatarEmoji: '🤖',
      action: '发布了新活动',
      activityTitle: '首届 Vibe Coding 创意大赛 🚀',
      time: '5小时前'
    },
    {
      id: 'f3',
      name: '快乐小狗',
      avatarEmoji: '🐶',
      action: '报名了活动',
      activityTitle: '迪士尼找搭子！本周六冲 🏰',
      time: '昨天'
    },
    {
      id: 'f4',
      name: '我',
      avatarEmoji: '👧',
      action: '发布了新活动',
      activityTitle: '周末桌游局，狼人杀组起来！',
      time: '2天前'
    },
    {
      id: 'f5',
      name: '极客公园',
      avatarEmoji: '🔥',
      action: '发布了新活动',
      activityTitle: '黑客松大赛·找靠谱队友 🔥',
      time: '3天前'
    }
  ],

  goals: [
    { id: 'g1', title: '本月运动目标', target: 10, current: 6, unit: '次' },
    { id: 'g2', title: '认识新朋友', target: 20, current: 14, unit: '人' },
    { id: 'g3', title: '参加活动数', target: 8, current: 5, unit: '场' }
  ],

  todos: [
    { id: 'td1', text: '准备VibeCoding大赛作品思路', done: false, date: '2026-07-20' },
    { id: 'td2', text: '买迪士尼发箍', done: true, date: '2026-07-19' },
    { id: 'td3', text: '注册Midjourney账号', done: false, date: '2026-07-22' },
    { id: 'td4', text: '预约羽毛球场地', done: true, date: '2026-07-18' },
    { id: 'td5', text: '量子计算预习资料', done: false, date: '2026-07-24' }
  ],

  // 朋友主页数据（按 followingItems 的 id 对应）
  friendProfiles: {
    f1: {
      id: 'f1',
      name: '小明同学',
      avatarEmoji: '👨',
      bio: '运动狂热分子，周末不在球场就在去球场的路上',
      creditScore: 92,
      tags: ['运动达人', '羽毛球', '夜跑', '靠谱队友'],
      achievements: [
        { emoji: '🏃', name: '运动健将', unlocked: true },
        { emoji: '🤝', name: '社交达人', unlocked: true },
        { emoji: '📅', name: '满勤奖', unlocked: true },
        { emoji: '🏆', name: '冠军之心', unlocked: false }
      ],
      schedule: [
        { date: '07-18', weekday: '周六', title: '羽毛球双打局', time: '14:00', location: '奥体中心' },
        { date: '07-20', weekday: '周一', title: '夜跑训练', time: '19:30', location: '奥森南门' },
        { date: '07-23', weekday: '周四', title: '篮球半场3v3', time: '18:00', location: '工体球场' }
      ],
      stats: { joinedCount: 28, hostedCount: 9, friendsCount: 54, maxStreak: 7 },
      activityIds: ['6', '1', '3', '4']
    },
    f2: {
      id: 'f2',
      name: 'TechHub 社区',
      avatarEmoji: '🤖',
      bio: '连接每一个有趣的技术灵魂，AI / 极客 / 创业者聚集地',
      creditScore: 98,
      isGroup: true,
      members: [
        { name: '码农小王', avatar: '👨‍💻' },
        { name: 'AI女孩', avatar: '👩‍💻' },
        { name: '全栈老李', avatar: '🧑‍💻' },
        { name: '小美同学', avatar: '👧', isMe: true }
      ],
      tags: ['AI', '极客社区', '黑客松', 'VibeCoding', '创业'],
      achievements: [
        { emoji: '🚀', name: '社区之星', unlocked: true },
        { emoji: '💡', name: '创意大师', unlocked: true },
        { emoji: '🤝', name: '百场主办', unlocked: true },
        { emoji: '🛡️', name: '金牌认证', unlocked: true }
      ],
      schedule: [
        { date: '07-20', weekday: '周一', title: 'Vibe Coding 创意大赛', time: '09:00', location: '线上·vibecoding.join.com' },
        { date: '07-26', weekday: '周日', title: '黑客松 48h', time: '09:00', location: '望京SOHO T3' },
        { date: '07-29', weekday: '周三', title: 'AI 沙龙第12期', time: '19:00', location: '中关村创业大街' }
      ],
      stats: { joinedCount: 102, hostedCount: 47, friendsCount: 318, maxStreak: 12 },
      activityRecords: [
        {
          id: 'g2-1', title: '大模型微调实战工作坊',
          coverEmoji: '🧠', category: 'AI',
          host: { name: 'TechHub 社区', avatarEmoji: '🤖', isVerified: true },
          location: '中关村创业大街', distance: '2.1km',
          date: '2026-07-15', startTime: '14:00', endTime: '17:00', fee: 0,
          maxParticipants: 60, currentParticipants: 48,
          tags: ['大模型', '微调', '实战'], isJoined: true
        },
        {
          id: 'g2-2', title: 'AI 改变生活：科普讲座第8期',
          coverEmoji: '🔬', category: '科普',
          host: { name: 'TechHub 社区', avatarEmoji: '🤖', isVerified: true },
          location: '国家图书馆', distance: '9.3km',
          date: '2026-07-12', startTime: '19:00', endTime: '21:00', fee: 0,
          maxParticipants: 200, currentParticipants: 176,
          tags: ['AI科普', '讲座', '免费'], isJoined: true
        },
        {
          id: 'g2-3', title: 'Vibe Coding 创意大赛 🚀',
          coverEmoji: '💻', category: '竞赛',
          host: { name: 'TechHub 社区', avatarEmoji: '🤖', isVerified: true },
          location: '中关村创业大街', distance: '2.1km',
          date: '2026-07-20', startTime: '09:00', endTime: '18:00', fee: 0,
          maxParticipants: 50, currentParticipants: 38,
          tags: ['VibeCoding', 'AI', '编程'], isJoined: false
        },
        {
          id: 'g2-4', title: 'AI 伦理圆桌讨论：技术向善',
          coverEmoji: '⚖️', category: 'AI',
          host: { name: 'TechHub 社区', avatarEmoji: '🤖', isVerified: true },
          location: '798艺术区 D区', distance: '8.2km',
          date: '2026-07-10', startTime: '15:00', endTime: '17:30', fee: 0,
          maxParticipants: 80, currentParticipants: 65,
          tags: ['AI伦理', '圆桌', '讨论'], isJoined: true
        }
      ]
    },
    f3: {
      id: 'f3',
      name: '快乐小狗',
      avatarEmoji: '🐶',
      bio: '一个人去太孤单，找搭子一起冲！性格随和速来',
      creditScore: 88,
      tags: ['找搭子', '迪士尼', '拍照', '探店', '社交'],
      achievements: [
        { emoji: '📸', name: '摄影达人', unlocked: true },
        { emoji: '🎢', name: '主题乐园控', unlocked: true },
        { emoji: '☕', name: '探店小王子', unlocked: true },
        { emoji: '🌙', name: '夜场之王', unlocked: false }
      ],
      schedule: [
        { date: '07-19', weekday: '周日', title: '迪士尼找搭子冲', time: '08:30', location: '上海迪士尼乐园' },
        { date: '07-21', weekday: '周二', title: '三里屯咖啡探店', time: '15:00', location: '三里屯' },
        { date: '07-24', weekday: '周五', title: '环球影城一日游', time: '09:00', location: '北京环球影城' }
      ],
      stats: { joinedCount: 41, hostedCount: 16, friendsCount: 73, maxStreak: 5 },
      activityIds: ['2', '4', '7', '8']
    },
    f5: {
      id: 'f5',
      name: '极客公园',
      avatarEmoji: '🔥',
      bio: '48小时造一个产品，奖金池 10w。缺前端和设计师，速来',
      creditScore: 96,
      isGroup: true,
      members: [
        { name: '后端大佬', avatar: '🧑‍💻' },
        { name: '算法工程师', avatar: '🧠' },
        { name: 'PM', avatar: '📋' },
        { name: '小美同学', avatar: '👧', isMe: true }
      ],
      tags: ['黑客松', 'AI for Good', '极客', '组队', '创业'],
      achievements: [
        { emoji: '⚡', name: '极速开发', unlocked: true },
        { emoji: '🏆', name: '黑客松冠军', unlocked: true },
        { emoji: '🛡️', name: '金牌主办', unlocked: true },
        { emoji: '🎯', name: '十年磨剑', unlocked: true }
      ],
      schedule: [
        { date: '07-26', weekday: '周日', title: '黑客松 AI for Good', time: '09:00', location: '望京SOHO T3' },
        { date: '07-30', weekday: '周四', title: 'Demo Day 路演', time: '14:00', location: '中关村创业大街' },
        { date: '08-02', weekday: '周日', title: '极客夜话 Vol.8', time: '19:00', location: '五道口万达广场' }
      ],
      stats: { joinedCount: 67, hostedCount: 23, friendsCount: 145, maxStreak: 9 },
      activityRecords: [
        {
          id: 'g5-1', title: '黑客松大赛·AI for Good 🔥',
          coverEmoji: '⚡', category: '竞赛',
          host: { name: '极客公园', avatarEmoji: '🔥', isVerified: true },
          location: '望京 SOHO T3', distance: '5.6km',
          date: '2026-07-26', startTime: '09:00', endTime: '07-27 12:00', fee: 0,
          maxParticipants: 5, currentParticipants: 3,
          tags: ['黑客松', 'AI', '组队'], isJoined: false
        },
        {
          id: 'g5-2', title: 'AI Agent 从0到1构建实战',
          coverEmoji: '🤖', category: 'AI',
          host: { name: '极客公园', avatarEmoji: '🔥', isVerified: true },
          location: '望京SOHO T3', distance: '5.6km',
          date: '2026-07-08', startTime: '14:00', endTime: '17:00', fee: 0,
          maxParticipants: 40, currentParticipants: 40,
          tags: ['AI Agent', '实战', '满员'], isJoined: true
        },
        {
          id: 'g5-3', title: '极客夜话 Vol.7：AGI 路线图',
          coverEmoji: '🌌', category: '科普',
          host: { name: '极客公园', avatarEmoji: '🔥', isVerified: true },
          location: '五道口万达广场', distance: '11km',
          date: '2026-07-05', startTime: '19:00', endTime: '21:30', fee: 0,
          maxParticipants: 120, currentParticipants: 98,
          tags: ['AGI', '夜话', '科普'], isJoined: true
        },
        {
          id: 'g5-4', title: '机器人编程体验营·零基础',
          coverEmoji: '🦾', category: '科普',
          host: { name: '极客公园', avatarEmoji: '🔥', isVerified: true },
          location: '中关村创业大街', distance: '2.1km',
          date: '2026-07-02', startTime: '10:00', endTime: '12:00', fee: 50,
          maxParticipants: 30, currentParticipants: 22,
          tags: ['机器人', '编程', '体验'], isJoined: true
        }
      ]
    }
  },

  // 聊天页 mock 消息（按朋友 id）
  chatMessages: {
    f1: [
      { from: 'them', text: '周六羽毛球你还来吗？', time: '10:28' },
      { from: 'them', text: '我带了新拍子，试试手感', time: '10:30' },
      { from: 'me', text: '必须来！我已经预约好场地了', time: '10:32' },
      { from: 'them', text: '太好了，那14点奥体中心见', time: '10:33' },
      { from: 'me', text: '没问题，打完一起吃火锅？', time: '10:35' },
      { from: 'them', text: '安排！我喜欢辣锅 🔥', time: '10:36' }
    ],
    f2: [
      { from: 'them', sender: { name: '码农小王', avatar: '👨‍💻' }, text: 'Vibe Coding 大赛明早9点开始，准备好了吗？', time: '09:02' },
      { from: 'them', sender: { name: 'AI女孩', avatar: '👩‍💻' }, text: '我们队还缺个前端，有谁来吗', time: '09:05' },
      { from: 'me', sender: { name: '小美同学', avatar: '👧' }, text: '我前端能打，给我留个位置！', time: '09:10' },
      { from: 'them', sender: { name: '全栈老李', avatar: '🧑‍💻' }, text: '稳了，报名网站 vibecoding.join.com', time: '09:12' },
      { from: 'them', sender: { name: '码农小王', avatar: '👨‍💻' }, text: '记得带笔记本和脑洞，明早中关村见', time: '09:13' }
    ],
    f3: [
      { from: 'them', text: '迪士尼的票我买好啦，周六见！', time: '昨天' },
      { from: 'me', text: '收到！需要带什么吗', time: '昨天' },
      { from: 'them', text: '带个好心情就行，我带了年卡可以走快速通道', time: '昨天' },
      { from: 'me', text: '太强了，烟花位你熟吗', time: '昨天' },
      { from: 'them', text: '熟！闭眼带你找最佳机位 🎆', time: '昨天' }
    ],
    f5: [
      { from: 'them', sender: { name: '后端大佬', avatar: '🧑‍💻' }, text: '黑客松缺前端和设计师，奖金池10w', time: '2天前' },
      { from: 'them', sender: { name: '算法工程师', avatar: '🧠' }, text: '主题是 AI for Good', time: '2天前' },
      { from: 'me', sender: { name: '小美同学', avatar: '👧' }, text: '我前端能打，设计师有认识的', time: '2天前' },
      { from: 'them', sender: { name: 'PM', avatar: '📋' }, text: '完美，48小时造个产品出来', time: '2天前' },
      { from: 'them', sender: { name: '后端大佬', avatar: '🧑‍💻' }, text: '周日9点望京SOHO T3集合，带电脑', time: '2天前' }
    ]
  }
};
