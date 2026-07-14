var MockData = {
  books: [
    {
      id: "book-001",
      title: "诚实的小恐龙",
      theme: "诚实",
      cover: "honesty",
      coverImage: "../assets/images/covers/book001_cover.svg",
      author: "孔先生",
      age: "5-6岁",
      style: "温暖水彩风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["诚实", "勇气", "责任"],
      valuesTagsFull: ["诚实", "勇气", "责任", "善良", "自省"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 19.8,
      memberPrice: 1.9,
      pages: [
        {
          illustration: "🦕💚",
          imageUrl: "../assets/images/pages/book001_page01.svg",
          text: "在一片翠绿的大森林里，住着一只叫豆豆的小恐龙。豆豆有碧绿的鳞片、圆圆的大眼睛，最喜欢和朋友们在森林里追逐玩耍。",
          narration: "在一片翠绿的大森林里，住着一只叫豆豆的小恐龙。豆豆有碧绿的鳞片、圆圆的大眼睛，最喜欢和朋友们在森林里追逐玩耍。"
        },
        { 
          illustration: "🏀💥", 
          imageUrl: "../assets/images/pages/book001_page02.svg",
          text: "一天，豆豆在家里玩皮球。'砰！'皮球飞了出去，把妈妈最心爱的花瓶打得粉碎。碎片撒了一地。",
          narration: "一天，豆豆在家里玩皮球。砰！皮球飞了出去，把妈妈最心爱的花瓶打得粉碎。碎片撒了一地。"
        },
        { 
          illustration: "😰🦕", 
          imageUrl: "../assets/images/pages/book001_page03.svg",
          text: "豆豆的心怦怦直跳。'要不……就说是风吹倒的吧？'可是这个念头一冒出来，豆豆的心里就像压了一块大石头，又闷又难受。", 
          narration: "豆豆的心怦怦直跳。要不……就说是风吹倒的吧？可是这个念头一冒出来，豆豆的心里就像压了一块大石头，又闷又难受。" 
        },
        { 
          illustration: "💬❤️", 
          imageUrl: "../assets/images/pages/book001_page04.svg",
          text: "豆豆深深吸了一口气，走到妈妈面前，低着头说：'妈妈，对不起，是我不小心打碎的。'声音小小的，但每个字都清清楚楚。", 
          narration: "豆豆深深吸了一口气，走到妈妈面前，低着头说：妈妈，对不起，是我不小心打碎的。声音小小的，但每个字都清清楚楚。" 
        },
        { 
          illustration: "🤗🦕", 
          imageUrl: "../assets/images/pages/book001_page05.svg",
          text: "妈妈蹲下来，温柔地抱住了豆豆：'花瓶碎了可以再买，但诚实的豆豆是世界上最珍贵的宝贝。'", 
          narration: "妈妈蹲下来，温柔地抱住了豆豆：花瓶碎了可以再买，但诚实的豆豆是世界上最珍贵的宝贝。" 
        },
        { 
          illustration: "🌟🦕", 
          imageUrl: "../assets/images/pages/book001_page06.svg",
          text: "那天晚上，豆豆躺在床上，心里暖暖的、亮亮的。它明白了：说真话的时候，心里就像有一颗小太阳在发光。", 
          narration: "那天晚上，豆豆躺在床上，心里暖暖的、亮亮的。它明白了：说真话的时候，心里就像有一颗小太阳在发光。" 
        }
      ],
      questions: [
        "豆豆一开始为什么不敢告诉妈妈？你也有过类似的感受吗？",
        "你觉得诚实为什么比不挨骂更重要？",
        "如果你是豆豆，你会怎么做？"
      ]
    },
    {
      id: "book-002",
      title: "勇敢的小兔子",
      theme: "勇气",
      cover: "bravery",
      coverImage: "../assets/images/covers/book002_cover.svg",
      author: "孔先生",
      age: "4-5岁",
      style: "童话绘本风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["勇敢", "自信", "坚持"],
      valuesTagsFull: ["勇敢", "自信", "坚持", "友爱", "乐观"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 19.8,
      memberPrice: 2.9,
      pages: [
        {
          illustration: "🐰🌙",
          imageUrl: "",
          text: "小兔子白白最怕黑了，每天晚上都要妈妈陪着才能睡着。", 
          narration: "小兔子白白最怕黑了，每天晚上都要妈妈陪着才能睡着。" 
        },
        { 
          illustration: "💡🐰", 
          imageUrl: "",
          text: "妈妈送给她一盏小夜灯，说：'勇敢不是不害怕，是害怕也要试一试。'", 
          narration: "妈妈送给她一盏小夜灯，说：勇敢不是不害怕，是害怕也要试一试。" 
        },
        { 
          illustration: "🛏️💪", 
          imageUrl: "",
          text: "那天晚上，白白决定自己睡。她打开了小夜灯，闭上了眼睛。", 
          narration: "那天晚上，白白决定自己睡。她打开了小夜灯，闭上了眼睛。" 
        },
        { 
          illustration: "🌅🐰", 
          imageUrl: "",
          text: "天亮了！白白睁开眼睛，发现自己做到了！", 
          narration: "天亮了！白白睁开眼睛，发现自己做到了！" 
        },
        { 
          illustration: "🎉🐰", 
          imageUrl: "",
          text: "妈妈在门口笑着鼓掌：'我为你骄傲，勇敢的小兔子！'", 
          narration: "妈妈在门口笑着鼓掌：我为你骄傲，勇敢的小兔子！" 
        }
      ],
      questions: [
        "白白是怎么战胜害怕的？你害怕的时候会怎么做？",
        "为什么妈妈说'勇敢不是不害怕，是害怕也要试一试'？",
        "你有没有像白白一样，害怕却做到了的事情？"
      ]
    },
    {
      id: "book-003",
      title: "感恩的小熊",
      theme: "感恩",
      cover: "gratitude",
      coverImage: "../assets/images/covers/book003_cover.svg",
      author: "孔先生",
      age: "4-6岁",
      style: "温暖水彩风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["感恩", "善良", "分享"],
      valuesTagsFull: ["感恩", "善良", "分享", "友爱", "尊重"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 25.8,
      memberPrice: 3.9,
      pages: [
        {
          illustration: "🐻🍯",
          imageUrl: "",
          text: "小熊乐乐最喜欢吃蜂蜜了，每天都要吃一大罐。", 
          narration: "小熊乐乐最喜欢吃蜂蜜了，每天都要吃一大罐。" 
        },
        { 
          illustration: "🐝🏠", 
          imageUrl: "",
          text: "可是乐乐从来没见过蜜蜂阿姨，不知道蜂蜜是怎么来的。", 
          narration: "可是乐乐从来没见过蜜蜂阿姨，不知道蜂蜜是怎么来的。" 
        },
        { 
          illustration: "🐻🐝", 
          imageUrl: "",
          text: "一天，乐乐跟着香味找到了蜜蜂阿姨的家。", 
          narration: "一天，乐乐跟着香味找到了蜜蜂阿姨的家。" 
        },
        { 
          illustration: "💐🍯", 
          imageUrl: "",
          text: "蜜蜂阿姨说：'我们每天飞很远的路采花蜜，才能酿成蜂蜜送给你。'", 
          narration: "蜜蜂阿姨说：我们每天飞很远的路采花蜜，才能酿成蜂蜜送给你。" 
        },
        { 
          illustration: "🌹🐝", 
          imageUrl: "",
          text: "乐乐听了很感动，他采来最美的花送给蜜蜂阿姨。", 
          narration: "乐乐听了很感动，他采来最美的花送给蜜蜂阿姨。" 
        },
        { 
          illustration: "❤️🐻", 
          imageUrl: "",
          text: "从那以后，乐乐每次吃蜂蜜都会说：'谢谢蜜蜂阿姨！'", 
          narration: "从那以后，乐乐每次吃蜂蜜都会说：谢谢蜜蜂阿姨！" 
        }
      ],
      questions: [
        "蜜蜂阿姨是怎么给乐乐做蜂蜜的？",
        "乐乐是怎么表达感谢的？你会怎么感谢帮助你的人？",
        "你觉得为什么要学会感恩？"
      ]
    },
    {
      id: "book-004",
      title: "我的情绪小怪兽",
      theme: "情绪管理",
      cover: "emotion",
      coverImage: "../assets/images/covers/book004_cover.svg",
      author: "孔先生",
      age: "3-5岁",
      style: "创意绘本风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["情绪", "认知", "表达"],
      valuesTagsFull: ["情绪", "认知", "表达", "接纳", "调节"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 29.8,
      memberPrice: 2.9,
      pages: [
        {
          illustration: "🌈👾",
          imageUrl: "",
          text: "小怪兽今天心情乱糟糟的，各种颜色混在一起。", 
          narration: "小怪兽今天心情乱糟糟的，各种颜色混在一起。" 
        },
        { 
          illustration: "😡🔴", 
          imageUrl: "",
          text: "红色是生气——像火山一样要爆发！", 
          narration: "红色是生气——像火山一样要爆发！" 
        },
        { 
          illustration: "😢💧", 
          imageUrl: "",
          text: "蓝色是难过——像下雨天一样想哭！", 
          narration: "蓝色是难过——像下雨天一样想哭！" 
        },
        { 
          illustration: "😄🌞", 
          imageUrl: "",
          text: "黄色是快乐——像太阳一样暖洋洋！", 
          narration: "黄色是快乐——像太阳一样暖洋洋！" 
        },
        { 
          illustration: "😌💚", 
          imageUrl: "",
          text: "绿色是平静——像森林一样很舒服！", 
          narration: "绿色是平静——像森林一样很舒服！" 
        },
        { 
          illustration: "🌈✨", 
          imageUrl: "",
          text: "小怪兽把每种情绪分开整理，心情变舒服了！", 
          narration: "小怪兽把每种情绪分开整理，心情变舒服了！" 
        }
      ],
      questions: [
        "你最喜欢哪种颜色的情绪？为什么？",
        "当你生气的时候，会怎么做让自己平静下来？",
        "你今天是什么颜色的心情呀？"
      ]
    },
    {
      id: "book-005",
      title: "分享的快乐",
      theme: "社交",
      cover: "social",
      coverImage: "../assets/images/covers/book005_cover.svg",
      author: "孔先生",
      age: "3-5岁",
      style: "温暖水彩风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["分享", "友爱", "合作"],
      valuesTagsFull: ["分享", "友爱", "合作", "尊重", "包容"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 23.8,
      memberPrice: 1.9,
      pages: [
        {
          illustration: "🐱🎁",
          imageUrl: "",
          text: "小猫喵喵收到了一个漂亮的礼物——一盒彩色蜡笔！", 
          narration: "小猫喵喵收到了一个漂亮的礼物——一盒彩色蜡笔！" 
        },
        { 
          illustration: "🐱🖍️", 
          imageUrl: "",
          text: "喵喵把蜡笔抱在怀里，谁也不给用。自己画画好像有点孤单。", 
          narration: "喵喵把蜡笔抱在怀里，谁也不给用。自己画画好像有点孤单。" 
        },
        { 
          illustration: "🐰🐱", 
          imageUrl: "",
          text: "小兔子蹦蹦来了：'喵喵，我们一起画画好吗？'", 
          narration: "小兔子蹦蹦来了：喵喵，我们一起画画好吗？" 
        },
        { 
          illustration: "🤝🖍️", 
          imageUrl: "",
          text: "喵喵犹豫了一下，把蜡笔分给了蹦蹦一半。", 
          narration: "喵喵犹豫了一下，把蜡笔分给了蹦蹦一半。" 
        },
        { 
          illustration: "🎨🌈", 
          imageUrl: "",
          text: "两个好朋友一起画了一幅彩虹画，比一个人画的好看多了！", 
          narration: "两个好朋友一起画了一幅彩虹画，比一个人画的好看多了！" 
        },
        { 
          illustration: "❤️🎉", 
          imageUrl: "",
          text: "喵喵明白了：好东西和朋友分享，快乐会变成双倍！", 
          narration: "喵喵明白了：好东西和朋友分享，快乐会变成双倍！" 
        }
      ],
      questions: [
        "喵喵一开始为什么不愿意分享蜡笔？",
        "分享后发生了什么有趣的事情？",
        "你有什么东西愿意和好朋友分享？"
      ]
    },
    {
      id: "book-006",
      title: "小种子的梦想",
      theme: "坚持与成长",
      cover: "growth",
      coverImage: "../assets/images/covers/book006_cover.svg",
      author: "孔先生",
      age: "4-6岁",
      style: "自然田园风",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["坚持", "成长", "自信"],
      valuesTagsFull: ["坚持", "成长", "自信", "耐心", "希望"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 22.8,
      memberPrice: 2.9,
      pages: [
        {
          illustration: "🌰🌍",
          imageUrl: "",
          text: "在深深的泥土里，住着一颗小小的种子。它叫芽芽，黑黑的，小小的，什么都看不见。",
          narration: "在深深的泥土里，住着一颗小小的种子。它叫芽芽，黑黑的，小小的，什么都看不见。"
        },
        {
          illustration: "🌧️🌱",
          imageUrl: "",
          text: "有一天，春雨姐姐来了，轻轻敲了敲泥土：'芽芽，该起床啦！外面的世界可美了！'",
          narration: "有一天，春雨姐姐来了，轻轻敲了敲泥土：芽芽，该起床啦！外面的世界可美了！"
        },
        {
          illustration: "💪🌿",
          imageUrl: "",
          text: "芽芽使劲往上顶，可是泥土好硬啊。'加油！再试一次！'它在心里给自己打气。",
          narration: "芽芽使劲往上顶，可是泥土好硬啊。加油！再试一次！它在心里给自己打气。"
        },
        {
          illustration: "🌱✨",
          imageUrl: "",
          text: "噗——芽芽终于钻出了地面！它看到了蓝蓝的天、白白的云，还有暖暖的太阳公公。",
          narration: "噗——芽芽终于钻出了地面！它看到了蓝蓝的天、白白的云，还有暖暖的太阳公公。"
        },
        {
          illustration: "🌻🌈",
          imageUrl: "",
          text: "一天天过去，芽芽长成了一棵高高的向日葵，开出了金色的大花盘，蜜蜂蝴蝶都来和它做朋友。",
          narration: "一天天过去，芽芽长成了一棵高高的向日葵，开出了金色的大花盘，蜜蜂蝴蝶都来和它做朋友。"
        },
        {
          illustration: "🌟🌻",
          imageUrl: "",
          text: "芽芽明白了：只要不放弃，小小的种子也能开出最美的花。",
          narration: "芽芽明白了：只要不放弃，小小的种子也能开出最美的花。"
        }
      ],
      questions: [
        "芽芽在泥土里的时候，是什么感觉？你有没有过类似的感受？",
        "是谁帮助了芽芽？你觉得在困难的时候，谁帮助过你？",
        "芽芽最后变成了什么？你觉得坚持做一件事，最后会有什么收获？"
      ]
    },
    {
      id: "book-007",
      title: "孔融让梨新编",
      theme: "谦让与爱",
      cover: "family",
      coverImage: "../assets/images/covers/book007_cover.svg",
      author: "孔先生",
      age: "5-7岁",
      style: "国风绘本",
      safety: "green",
      safetyLabel: "绿级安全",
      valuesTags: ["谦让", "友爱", "传统美德"],
      valuesTagsFull: ["谦让", "友爱", "传统美德", "家庭", "善良"],
      warningTags: [],
      price: 9.9,
      priceOriginal: 26.8,
      memberPrice: 3.9,
      pages: [
        {
          illustration: "👨‍👩‍👧‍👦🏠",
          imageUrl: "",
          text: "周末的下午，妈妈端来一盘水灵灵的大梨子，放在客厅的茶几上。",
          narration: "周末的下午，妈妈端来一盘水灵灵的大梨子，放在客厅的茶几上。"
        },
        {
          illustration: "🍐👀",
          imageUrl: "",
          text: "弟弟妹妹们围了过来，眼睛亮晶晶的。最大的那个梨子，黄澄澄的，闻起来甜甜的。",
          narration: "弟弟妹妹们围了过来，眼睛亮晶晶的。最大的那个梨子，黄澄澄的，闻起来甜甜的。"
        },
        {
          illustration: "🤔💭",
          imageUrl: "",
          text: "乐乐也想要最大的那个。可是她看到弟弟妹妹渴望的眼神，心里犹豫了一下。",
          narration: "乐乐也想要最大的那个。可是她看到弟弟妹妹渴望的眼神，心里犹豫了一下。"
        },
        {
          illustration: "🎁💛",
          imageUrl: "",
          text: "乐乐拿起最大的梨子，转身递给了最小的妹妹：'给你吃，你最小，大的给你。'",
          narration: "乐乐拿起最大的梨子，转身递给了最小的妹妹：给你吃，你最小，大的给你。"
        },
        {
          illustration: "😊👏",
          imageUrl: "",
          text: "妹妹开心地笑了，妈妈也笑了，夸乐乐是个懂事的好姐姐。",
          narration: "妹妹开心地笑了，妈妈也笑了，夸乐乐是个懂事的好姐姐。"
        },
        {
          illustration: "❤️🏠",
          imageUrl: "",
          text: "乐乐发现，看到妹妹开心的样子，比自己吃到大梨子还要甜。一家人在一起，比什么都好。",
          narration: "乐乐发现，看到妹妹开心的样子，比自己吃到大梨子还要甜。一家人在一起，比什么都好。"
        }
      ],
      questions: [
        "乐乐为什么把最大的梨子让给了妹妹？",
        "如果你有很多好吃的，你会分给谁？为什么？",
        "你觉得'谦让'和'吃亏'有什么不同？"
      ]
    }
  ],

  characters: {
    kong: {
      name: "孔先生",
      avatar: "孔",
      desc: "私塾先生，为家长把关价值观"
    },
    xiaoan: {
      name: "小安",
      avatar: "安",
      desc: "陪读小伙伴，陪孩子读书聊天"
    }
  },

  kongMessages: [
    {
      type: "text",
      content: "早安。昨晚小安陪孩子读了《诚实的小恐龙》，孩子读完后主动和我分享了他的一次诚实经历。这周阅读进度如下：",
      time: "今天 08:30"
    },
    {
      type: "report",
      title: "本周阅读报告",
      date: "2026年7月第一周",
      stats: { readCount: 5, newBooks: 2, totalMinutes: 85 },
      radar: [
        { label: "品德", value: 85 },
        { label: "社会性", value: 62 },
        { label: "情绪", value: 70 },
        { label: "认知", value: 78 },
        { label: "文化素养", value: 55 },
        { label: "生活能力", value: 60 }
      ],
      suggestion: "本周勇敢主题阅读偏多，感恩与情绪认知尚未涉及。为您推荐3本绿级绘本补齐：\n· 《感恩的小熊》——感恩主题\n· 《我的情绪小怪兽》——情绪认知\n· 《分享的快乐》——社会性发展\n亲子互动建议：这周可以和孩子聊聊「别人帮助我时该怎么表达感谢」。",
      time: "今天 08:30"
    }
  ],

  xiaoanMessages: [
    {
      type: "text",
      content: "嗨，小明！我是小安，今天为你准备了这些好书！",
      time: "现在"
    },
    {
      type: "book-recommend",
      books: ["book-001", "book-002"],
      content: "孔先生知道你喜欢恐龙，特意给你准备了两本恐龙故事书！",
      time: "现在"
    }
  ],

  xiaoanQuickReplies: [
    { icon: "📖", text: "我想读书", action: "read" },
    { icon: "🦕", text: "讲个恐龙故事", action: "dinosaur" },
    { icon: "🌟", text: "今日推荐", action: "recommend" },
    { icon: "💬", text: "和我聊聊", action: "chat" }
  ],

  xiaoanReplyRules: [
    { keywords: ["恐龙", "dinosaur"], reply: "我最喜欢恐龙了！🦕 给你推荐《诚实的小恐龙》，里面的豆豆可勇敢了，你一定会喜欢！" },
    { keywords: ["害怕", "怕黑", "勇敢"], reply: "害怕是很正常的哦～《勇敢的小兔子》里的白白也怕黑，但她还是试了试。你也来读读看吧！" },
    { keywords: ["谢谢", "感恩"], reply: "懂得感恩的孩子最棒了！《感恩的小熊》里的小熊乐乐学会了感谢蜜蜂阿姨，你也来读读吧～" },
    { keywords: ["开心", "快乐", "高兴"], reply: "太好了！小明今天心情不错呢！来读一本开心的绘本吧！" },
    { keywords: ["难过", "伤心", "哭"], reply: "小明别难过，小安陪着你。《我的情绪小怪兽》说，难过是蓝色的，读完会舒服一些哦～" },
    { keywords: ["分享", "朋友"], reply: "和好朋友分享最开心了！《分享的快乐》里的小猫喵喵也学会了分享蜡笔呢！" },
    { keywords: ["种子", "坚持", "努力"], reply: "坚持是一件很了不起的事！《小种子的梦想》里的小芽芽在泥土里使劲往上钻，最后开出了最美的花！" },
    { keywords: ["谦让", "让", "梨"], reply: "谦让是中华民族的传统美德呢！《孔融让梨新编》里的乐乐把最大的梨子让给了妹妹，可温暖了～" },
    { keywords: ["你好", "hi", "嗨"], reply: "小明你好呀！我是小安，随时陪你聊天，也陪你读书哦～" },
    { keywords: ["再见", "bye", "拜拜"], reply: "下次见咯，小明！我会想你的～" }
  ],

  familyValues: {
    core: ["诚实", "勇敢", "善良"],
    secondary: ["责任", "感恩", "尊重"],
    forbidden: ["暴力", "恐怖", "粗口"],
    childName: "小明",
    childAge: 5,
    childCharacter: "活泼好奇",
    childInterest: "恐龙",
    readingLevel: "识字量约200字，注意力时长15分钟",
    shouTuMessage: "小明，你好。我是孔先生，从今天起，我就是你的私塾先生了。你喜欢恐龙，活泼好奇，是个勇敢探索世界的小探险家。我会用最好的故事陪伴你，让诚实、勇敢和善良成为你最好的朋友。"
  },

  // AI审核依据（每本绘本的审核详情）
  auditDetails: {
    "book-001": {
      level: "green",
      score: 92,
      checks: [
        { item: "价值观匹配", result: "通过", detail: "诚实主题与家庭核心价值观高度一致", score: 95 },
        { item: "语言安全", result: "通过", detail: "无暴力、恐怖、粗口等敏感词汇", score: 100 },
        { item: "情感适宜", result: "通过", detail: "紧张-释然的情感曲线适合5-6岁儿童理解", score: 88 },
        { item: "年龄适配", result: "通过", detail: "文本难度与小明200字识字量匹配", score: 90 },
        { item: "插图安全", result: "通过", detail: "无恐怖、血腥、不适画面", score: 95 },
        { item: "教育价值", result: "通过", detail: "包含3个启发式提问，促进亲子对话", score: 85 }
      ],
      summary: "综合评分92分，绿级安全。内容健康积极，插图温馨，强烈推荐。"
    },
    "book-002": {
      level: "green",
      score: 90,
      checks: [
        { item: "价值观匹配", result: "通过", detail: "勇敢主题与家庭核心价值观高度一致", score: 95 },
        { item: "语言安全", result: "通过", detail: "无敏感词汇，表达温暖鼓励", score: 100 },
        { item: "情感适宜", result: "通过", detail: "怕黑到勇敢的情感成长适合4-5岁儿童", score: 85 },
        { item: "年龄适配", result: "通过", detail: "简单句式适合小明阅读水平", score: 92 },
        { item: "插图安全", result: "通过", detail: "夜间场景温和不恐怖", score: 88 },
        { item: "教育价值", result: "通过", detail: "传递'勇敢不是不害怕'的积极价值观", score: 90 }
      ],
      summary: "综合评分90分，绿级安全。情感教育价值突出，适合怕黑的孩子。"
    },
    "book-003": {
      level: "green",
      score: 88,
      checks: [
        { item: "价值观匹配", result: "通过", detail: "感恩主题与家庭核心价值观一致", score: 90 },
        { item: "语言安全", result: "通过", detail: "无敏感词汇", score: 100 },
        { item: "情感适宜", result: "通过", detail: "温馨感恩的情感基调适合4-6岁儿童", score: 88 },
        { item: "年龄适配", result: "通过", detail: "文本含少量长句，建议亲子共读", score: 82 },
        { item: "插图安全", result: "通过", detail: "蜜蜂和自然场景温和无害", score: 90 },
        { item: "教育价值", result: "通过", detail: "引导孩子理解他人劳动，学会感恩", score: 85 }
      ],
      summary: "综合评分88分，绿级安全。建议亲子共读，理解感恩的意义。"
    }
  }
};