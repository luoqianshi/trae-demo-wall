const CHARACTERS = [
  {
    id: 'xiaolin',
    name: '小林',
    emoji: '📚',
    image: 'assets/characters/xiaolin.jpg',
    title: '抱着书本的女孩',
    age: 22,
    occupation: '考研二战学生',
    bgColor: '#e8d5c4',
    intro: '每天最放松的时刻，就是在去图书馆的路上。那位总坐在角落的老奶奶会问她"今天书读得怎么样"，即使她昨天骗她说"挺好的"。',
    emotion: '焦虑疲惫',
    keywords: ['压力', '未来', '害怕失败', '坚持'],
    preferredDrink: {
      base: 'espresso',
      temperature: 'hot',
      sweetness: 'medium',
      topping: 'milkfoam'
    },
    chapter: 1,
    unlockRequirement: null,
    story: {
      opening: '小林抱着一摞考研资料推开了咖啡馆的门。',
      lines: [
        { type: 'narrator', text: '她的眼眶有点红，但看到你时还是挤出了一个微笑。' },
        { type: 'customer', text: '"请给我一杯...能让我坚持到晚上的东西。"', clue: '需要提神，应该是咖啡基底' },
        { type: 'customer', text: '"不要太甜，我想保持清醒。但也不要太苦..."', clue: '半糖，需要咖啡但不要太刺激' },
        { type: 'narrator', text: '她下意识地裹紧了围巾，手指有些发红。' }
      ],
      ending: {
        perfect: '小林喝完后，整个人似乎舒展了一些。"今晚我会把这套题做完的。谢谢你。"',
        good: '"味道还可以，"小林看了看表，"我该回图书馆了。"',
        neutral: '她礼貌地点点头，但眼神很快又落回了书本上。',
        bad: '"抱歉，这不是我想要的..."她把杯子推远了些。'
      }
    },
    observation: {
      text: '她的帆布包上挂着图书馆的借书卡，手边是一本翻得很旧的英语词汇书。眼下的黑眼圈说明她最近睡得很晚。',
      clue: '需要提神醒脑的饮品，温度偏热，不要太甜'
    },
    followUp: {
      text: '"你平时喜欢喝什么？" 小林想了想："我习惯点拿铁，但今天太困了，想要浓一点的。"',
      clue: '咖啡基底，加奶泡'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「上岸之后」',
      lines: [
        { type: 'narrator', text: '几个月后，小林推门进来，手里没有拿书。' },
        { type: 'customer', text: '"我考上了。"她的声音很轻，但眼睛很亮。' },
        { type: 'customer', text: '"那天那杯咖啡，是我复习时最常想起的味道。"' },
        { type: 'narrator', text: '她把一朵小小的向日葵放在吧台上。' }
      ],
      ending: '有些陪伴不需要太久，却能在一个人 hardest 的时刻，成为她继续的理由。',
      reward: 50
    }
  },
  {
    id: 'ajie',
    name: '阿杰',
    emoji: '🚕',
    image: 'assets/characters/ajie.jpg',
    title: '凌晨的出租车司机',
    age: 28,
    occupation: '出租车司机',
    bgColor: '#d4c4b0',
    intro: '凌晨两点加班结束，在地铁上打开游戏。那个女孩还在窗边坐着，他给她做了杯热可可。她没有说话，但他知道她还在。这就够了。',
    emotion: '孤独迷茫',
    keywords: ['人生', '意义', '疲惫', '孤独'],
    preferredDrink: {
      base: 'milk',
      temperature: 'hot',
      sweetness: 'high',
      topping: 'none'
    },
    chapter: 1,
    unlockRequirement: null,
    story: {
      opening: '一个浑身带着寒气的男人推门而入。',
      lines: [
        { type: 'narrator', text: '他的制服上还有夜雨的痕迹，眼睛里布满了红血丝。' },
        { type: 'customer', text: '"老板，还有热的东西吗？我刚送完最后一单。"', clue: '需要热的饮品' },
        { type: 'customer', text: '"今天特别累，想喝点甜的...甜一点没关系。"', clue: '多糖' },
        { type: 'customer', text: '"不要加那些花里胡哨的东西，简单点就好。"', clue: '不加配料' }
      ],
      ending: {
        perfect: '阿杰捧着杯子，沉默了很久。"这个味道...像我小时候妈妈给我冲的。"',
        good: '"挺暖和的，"他笑了笑，"能再坐一会儿吗？"',
        neutral: '他喝了几口，看起来并没有被特别打动。',
        bad: '"算了，我还是走吧。"他放下杯子，起身离开。'
      }
    },
    observation: {
      text: '他的制服上别着"安全行驶100万公里"的徽章，但袖口有些磨损。他的手很粗糙，指节处还有没擦干净的油污。',
      clue: '深夜工作的人需要高热量、高甜度的温暖饮品'
    },
    followUp: {
      text: '"想喝点甜的还是苦的？" 阿杰苦笑："生活已经够苦了，我想甜一点。"',
      clue: '高甜度，牛奶或热可可基底'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「凌晨三点的归途」',
      lines: [
        { type: 'narrator', text: '某个深夜，阿杰没有直接回家，而是把车停在了咖啡馆门口。' },
        { type: 'customer', text: '"我女儿今天出生了。"他说这话时，眼眶红了。' },
        { type: 'customer', text: '"我以前总觉得日子过得没意义，现在...想多赚点奶粉钱。"' },
        { type: 'narrator', text: '他点了一杯最甜的热牛奶，说要带回去给妻子。' }
      ],
      ending: '生活也许依然辛苦，但有人等你回家，本身就是一种意义。',
      reward: 50
    }
  },
  {
    id: 'xiaoyu',
    name: '小雨',
    emoji: '🎒',
    image: 'assets/characters/xiaoyu.jpg',
    title: '不敢回家的孩子',
    age: 9,
    occupation: '小学生',
    bgColor: '#f0e0d0',
    intro: '一个9岁有轻度社交障碍的女孩，在我们的游戏原型里花了20分钟反复调整一杯蜂蜜牛奶的温度，因为担心"她喝了会不会开心"。',
    emotion: '害怕不安',
    keywords: ['害怕', '父母', '成绩', '想躲起来'],
    preferredDrink: {
      base: 'milk',
      temperature: 'warm',
      sweetness: 'high',
      topping: 'honey'
    },
    chapter: 1,
    unlockRequirement: null,
    story: {
      opening: '门被轻轻推开了一条缝，一个小小的身影探了进来。',
      lines: [
        { type: 'narrator', text: '她背着大大的书包，手里攥着一张考卷。' },
        { type: 'customer', text: '"我...我可以在这里坐一会儿吗？我不想回家..."', clue: '需要安慰，温和的饮品' },
        { type: 'customer', text: '"我想要甜甜的，但不要咖啡，我晚上会睡不着。"', clue: '牛奶基底，多糖' },
        { type: 'narrator', text: '她把考卷往书包里塞了塞，眼角有泪痕。' }
      ],
      ending: {
        perfect: '小雨捧着杯子，小声说："这个甜甜的，和我奶奶做的一样。"她终于笑了。',
        good: '"好喝，"她点点头，但还在偷偷看门口。',
        neutral: '她抿了一口，没有说话，把杯子抱在手里取暖。',
        bad: '"不好喝..."她的眼泪又掉下来了。'
      }
    },
    observation: {
      text: '她的书包上挂着一只破旧的毛绒兔子，校服领口别着"值日生"的徽章。考卷的一角露出来，上面是红色的78分。',
      clue: '孩子需要温和、甜、无咖啡因的饮品'
    },
    followUp: {
      text: '"你平时喜欢喝什么呀？" 小雨低头："我喜欢奶奶给我泡的蜂蜜水。"',
      clue: '蜂蜜配料，牛奶基底'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「奶奶来接你了」',
      lines: [
        { type: 'narrator', text: '一个平常的下午，小雨带着一个老人走进了咖啡馆。' },
        { type: 'customer', text: '"这是奶奶。"小雨拉着老人的手，"我跟她说，这里有最好喝的蜂蜜水。"' },
        { type: 'customer', text: '"奶奶，他就是我跟你说的那个老板，他会听我说话。"' },
        { type: 'narrator', text: '老人笑着对你说："谢谢你，让我家小雨愿意回家。"' }
      ],
      ending: '孩子要的从来不是评判，而是一个让她觉得安全的角落。',
      reward: 50
    }
  },
  {
    id: 'laoli',
    name: '老李',
    emoji: '🧢',
    image: 'assets/characters/laoli.jpg',
    title: '退休的体育老师',
    age: 65,
    occupation: '退休教师',
    bgColor: '#d8c8b8',
    intro: '退休后突然不知道每天该干什么了，老伴去世三年了，儿子在国外。每天来咖啡馆坐坐，和年轻人说说话，是他一天中最期待的事。',
    emotion: '怀念孤独',
    keywords: ['老伴', '过去', '回忆', '想念'],
    preferredDrink: {
      base: 'tea',
      temperature: 'hot',
      sweetness: 'low',
      topping: 'none'
    },
    chapter: 2,
    unlockRequirement: { chapter: 1, minStories: 2 },
    story: {
      opening: '一位精神矍铄的老人准时在下午三点推开了门。',
      lines: [
        { type: 'narrator', text: '他的步伐很轻快，但眼神里藏着一丝落寞。' },
        { type: 'customer', text: '"小伙子，今天我想讲讲我老伴以前做咖啡的手艺。"', clue: '老人想要传统、简单的饮品' },
        { type: 'customer', text: '"她总说，苦一点才记得住日子本来的味道。"', clue: '无糖或低糖' },
        { type: 'customer', text: '"茶也可以，咖啡太刺激我睡不着。"', clue: '茶基底' }
      ],
      ending: {
        perfect: '老李捧着茶杯，眼眶微红。"这个味道...像她泡的。"',
        good: '"好茶，"他点点头，开始讲他和老伴的故事。',
        neutral: '他喝了口茶，欲言又止。',
        bad: '"不是这个味..."他摇摇头，没再说话。'
      }
    },
    observation: {
      text: '老李穿着洗得很干净的旧运动服，手腕上戴着一只老式机械表。他总是坐在靠窗的位置，像是在等什么人。',
      clue: '老人偏好传统茶饮，热、无糖、不加配料'
    },
    followUp: {
      text: '"您想喝咖啡还是茶？" 老李摆摆手："茶吧，咖啡晚上睡不着。"',
      clue: '清茶基底，热饮'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「老伴的食谱」',
      lines: [
        { type: 'narrator', text: '老李今天带来了一个旧旧的笔记本。' },
        { type: 'customer', text: '"这是老伴当年记的茶谱，我想...把它留给你。"' },
        { type: 'customer', text: '"她说，好茶要配好人。我觉得你值得。"' },
        { type: 'narrator', text: '笔记本里夹着一张泛黄的照片，是两个年轻人站在一棵桂花树下。' }
      ],
      ending: '记忆不会消失，只是换了一种方式，继续温暖后来的人。',
      reward: 50
    }
  },
  {
    id: 'xiaomei',
    name: '小美',
    emoji: '💻',
    image: 'assets/characters/xiaomei.jpg',
    title: '互联网运营',
    age: 26,
    occupation: '互联网运营',
    bgColor: '#e5d5c5',
    intro: '连续加班三个月了，今天终于提交了项目。本应该开心的，但突然不知道要干什么了，感觉被掏空了。',
    emotion: '空虚麻木',
    keywords: ['加班', '空虚', '目标', '失去自我'],
    preferredDrink: {
      base: 'espresso',
      temperature: 'iced',
      sweetness: 'low',
      topping: 'mint'
    },
    chapter: 2,
    unlockRequirement: { chapter: 1, minStories: 2 },
    story: {
      opening: '一个妆容精致却难掩疲惫的女孩走了进来。',
      lines: [
        { type: 'narrator', text: '她盯着菜单看了很久，似乎不知道该点什么。' },
        { type: 'customer', text: '"我...我刚加完班，突然不知道自己想喝什么了。"', clue: '疲惫需要提神但不想太腻' },
        { type: 'customer', text: '"想要清醒一点，冰一点，不要甜。"', clue: '冰、无糖' },
        { type: 'customer', text: '"有什么能让人一下子精神起来的吗？"', clue: '咖啡/薄荷提神' }
      ],
      ending: {
        perfect: '小美喝了一大口，闭了闭眼睛。"...清醒多了。谢谢你。"',
        good: '"不错，很提神。"她揉了揉太阳穴。',
        neutral: '她喝了点，但眼神还是涣散的。',
        bad: '"不够劲..."她把杯子放到一边。'
      }
    },
    observation: {
      text: '小美的电脑包上还挂着工牌，手机不断弹出工作消息。她的眼妆有点花，口红也淡了很多。',
      clue: '需要冰爽、提神、无糖的饮品'
    },
    followUp: {
      text: '"今天想喝冰的还是热的？" 小美："冰的，我要让自己清醒过来。"',
      clue: '冰饮，薄荷配料'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「辞职后的第一个早晨」',
      lines: [
        { type: 'narrator', text: '小美没有背电脑包，而是抱着一盆多肉植物。' },
        { type: 'customer', text: '"我辞职了。昨天租下了一个小花店。"' },
        { type: 'customer', text: '"那杯薄荷咖啡让我意识到，清醒之后，我可以选择不回到那个漩涡里。"' },
        { type: 'narrator', text: '她把你的咖啡杯换成了她带来的小花盆。' }
      ],
      ending: '人生不是只有一条跑道，停下来，也许会看见花。',
      reward: 50
    }
  },
  {
    id: 'liayi',
    name: '李阿姨',
    emoji: '🧶',
    image: 'assets/characters/liayi.jpg',
    title: '空巢母亲',
    age: 55,
    occupation: '退休主妇',
    bgColor: '#dcc8b8',
    intro: '女儿教她怎么玩，现在每天晚上她们都会互相看看对方的咖啡馆。她在上海，女儿在老家，但她们会在游戏里一起喝杯下午茶。',
    emotion: '思念牵挂',
    keywords: ['女儿', '远方', '亲情', '等待'],
    preferredDrink: {
      base: 'tea',
      temperature: 'warm',
      sweetness: 'medium',
      topping: 'honey'
    },
    chapter: 2,
    unlockRequirement: { chapter: 1, minStories: 2 },
    story: {
      opening: '一位温和的中年女性小心翼翼地推开门。',
      lines: [
        { type: 'narrator', text: '她手里拿着手机，似乎在和人视频通话。' },
        { type: 'customer', text: '"我女儿说这里很好，让我来试试...她在外地工作，平时就我们打打视频。"', clue: '母女温情，温和的下午茶' },
        { type: 'customer', text: '"她喜欢甜的，但我喝不了太甜。"', clue: '半糖' },
        { type: 'customer', text: '"茶比较好，我们老家习惯喝茶。"', clue: '茶基底' }
      ],
      ending: {
        perfect: '李阿姨对着手机说："闺女，这家店真的会做茶呢。"',
        good: '"挺好喝的，"她笑着对视频说，"下次我们一起来。"',
        neutral: '她喝了一口，继续和女儿聊天，没太在意味道。',
        bad: '"好像太甜了..."她皱了皱眉。'
      }
    },
    observation: {
      text: '李阿姨的手机壳上印着和女儿合照，聊天背景是家里的客厅。她点单前先发了一条语音："妈到咖啡店了。"',
      clue: '母女 shared moment，温和茶饮，半糖加蜂蜜'
    },
    followUp: {
      text: '"您平时和女儿一起喝什么？" 李阿姨笑："她喜欢奶茶，我爱喝蜂蜜水。"',
      clue: '蜂蜜配料，茶基底'
    },
    specialStory: {
      unlockFavorability: 80,
      title: '「母女同框」',
      lines: [
        { type: 'narrator', text: '李阿姨今天不是一个人来的，她身边站着一个和她长得很像的年轻女孩。' },
        { type: 'customer', text: '"这是我闺女，她从老家来看我了。"李阿姨笑得合不拢嘴。' },
        { type: 'customer', text: '"妈天天跟我说你们店的茶好，今天我终于喝到了。"女孩举起杯子。' },
        { type: 'narrator', text: '她们在靠窗的位置坐了一下午，笑声不断。' }
      ],
      ending: '爱有很多种距离，但愿意靠近的心，总能找到相聚的方式。',
      reward: 50
    }
  }
];
