window.DemoData = {
  categories: [
    { id: 'cat1', name: '自然世界', emoji: '🌿', totalChars: 22, progress: 30 },
    { id: 'cat2', name: '身体部位', emoji: '👤', totalChars: 18, progress: 50 },
    { id: 'cat3', name: '数字量词', emoji: '🔢', totalChars: 15, progress: 40 },
    { id: 'cat4', name: '家人称呼', emoji: '👪', totalChars: 12, progress: 60 },
    { id: 'cat5', name: '常见动物', emoji: '🐶', totalChars: 20, progress: 25 },
    { id: 'cat6', name: '日常食物', emoji: '🍎', totalChars: 16, progress: 35 }
  ],

  cards: [
    {
      id: 'c001',
      char: '山',
      pinyin: 'shān',
      tone: 1,
      categoryId: 'cat1',
      words: ['高山', '山水', '山峰'],
      sentences: ['远处有一座高山。', '山水之间有一座小桥。'],
      synonyms: ['峰', '岭'],
      antonyms: ['水', '川'],
      originGlyph: '⛰️',
      originText: '古时候的人看见高高的山峰，就照着山峰的样子画了一个「山」字。',
      story: '我是小兔！你看三座尖尖的山峰连在一起，就像我的三只耳朵竖起来啦！',
      storyEmoji: '⛰️',
      wordEmojis: ['🏔️', '💧', '⛰️'],
      strokeOrder: '竖、竖折、竖',
      riddle: {q: '身上长满树，头上顶白云，远处看一眼，三个尖尖顶。', a: '山', hint: '大自然里很高很高的东西'}
    },
    {
      id: 'c002',
      char: '水',
      pinyin: 'shuǐ',
      tone: 3,
      categoryId: 'cat1',
      words: ['河水', '水果', '山水'],
      sentences: ['河水清澈见底。', '我喜欢吃水果。'],
      synonyms: ['川', '河'],
      antonyms: ['山', '火'],
      originGlyph: '💧',
      originText: '「水」字弯弯的笔画，就像小河里流动的水波。',
      story: '我是小兔！小河的水哗啦啦流，我在河边照镜子，看见自己毛茸茸的脸啦！',
      storyEmoji: '💧',
      wordEmojis: ['🌊', '🍎', '💧'],
      strokeOrder: '竖钩、横撇、撇、捺',
      riddle: {q: '看得见摸得着，抓不住也留不下，小河流里跑，杯子里安家。', a: '水', hint: '口渴了要喝它'}
    },
    {
      id: 'c003',
      char: '日',
      pinyin: 'rì',
      tone: 4,
      categoryId: 'cat1',
      words: ['日出', '日子', '日月'],
      sentences: ['日出的景色很美。', '今天是个好日子。'],
      synonyms: ['太阳', '天'],
      antonyms: ['月', '夜'],
      originGlyph: '☀️',
      originText: '「日」字原来是个圆圆的太阳，中间加一点，后来变成方方的样子。',
      story: '我是小兔！白天太阳公公出来，我就在草地上蹦蹦跳跳晒太阳！',
      storyEmoji: '☀️',
      wordEmojis: ['🌅', '📅', '🌞'],
      strokeOrder: '竖、横折、横、横',
      riddle: {q: '一个圆饼天上挂，白天出来夜里藏，照得大地暖洋洋。', a: '日', hint: '和"月"是好兄弟'}
    },
    {
      id: 'c004',
      char: '月',
      pinyin: 'yuè',
      tone: 4,
      categoryId: 'cat1',
      words: ['月亮', '月光', '日月'],
      sentences: ['月亮圆圆的像个盘子。', '月光洒在大地上。'],
      synonyms: ['月亮', '明月'],
      antonyms: ['日', '太阳'],
      originGlyph: '🌙',
      originText: '「月」字弯弯的，就像夜空中挂在天上的月亮。',
      story: '我是小兔！晚上的月亮弯弯的，像一根大胡萝卜，馋得我直舔嘴巴！',
      storyEmoji: '🌙',
      wordEmojis: ['🌕', '💡', '🌞'],
      strokeOrder: '撇、横折钩、横、横',
      riddle: {q: '晚上天上挂，弯弯像小船，十五变圆圆，白天躲不见。', a: '月', hint: '和"日"相对'}
    },
    {
      id: 'c005',
      char: '花',
      pinyin: 'huā',
      tone: 1,
      categoryId: 'cat1',
      words: ['花朵', '花园', '开花'],
      sentences: ['花园里开满了花朵。', '春天来了，花儿开了。'],
      synonyms: ['花朵', '鲜花'],
      antonyms: ['草', '叶'],
      originGlyph: '🌸',
      originText: '「花」字上面是草，下面是化，表示草地上开出了漂亮的花。',
      story: '我是小兔！花园里花朵香香的，我戴一朵在耳边，变成花仙兔啦！',
      storyEmoji: '🌸',
      wordEmojis: ['🌺', '🌷', '🌼'],
      strokeOrder: '横、竖、竖、撇、竖、撇、竖弯钩',
      riddle: {q: '园里长得俏，五颜六色笑，蜜蜂嗡嗡来，香味四处飘。', a: '花', hint: '春天开的东西'}
    },
    {
      id: 'c006',
      char: '眼',
      pinyin: 'yǎn',
      tone: 3,
      categoryId: 'cat2',
      words: ['眼睛', '眼光', '眼神'],
      sentences: ['她有一双大眼睛。', '他的眼神很温柔。'],
      synonyms: ['目', '眼睛'],
      antonyms: ['耳', '嘴'],
      originGlyph: '👁️',
      originText: '「眼」字左边是目（眼睛），右边是艮，合起来就是看东西的眼睛。',
      story: '我是小兔！我有一双长长睫毛的大眼睛，能看到很远的小胡萝卜！',
      storyEmoji: '👁️',
      wordEmojis: ['👀', '✨', '💫'],
      strokeOrder: '竖、横折、横、横、横、横折、横、横、竖提、撇、捺',
      riddle: {q: '上面毛，下面毛，中间一颗黑葡萄，白天开门看世界，夜里关门睡大觉。', a: '眼', hint: '长在脸上能看东西'}
    },
    {
      id: 'c007',
      char: '耳',
      pinyin: 'ěr',
      tone: 3,
      categoryId: 'cat2',
      words: ['耳朵', '耳机', '木耳'],
      sentences: ['兔子的耳朵长长的。', '我戴着耳机听音乐。'],
      synonyms: ['耳朵', '听觉'],
      antonyms: ['眼', '目'],
      originGlyph: '👂',
      originText: '「耳」字就像人耳朵的形状，用来听声音。',
      story: '我是小兔！我的耳朵长长哒，风一吹就能听见远处妈妈喊我回家！',
      storyEmoji: '👂',
      wordEmojis: ['🐰', '🎧', '🍄'],
      strokeOrder: '横、竖、竖、横、横、横',
      riddle: {q: '左边一座山，右边一座山，中间一道沟，声音里面钻。', a: '耳', hint: '长在头两边能听'}
    },
    {
      id: 'c008',
      char: '口',
      pinyin: 'kǒu',
      tone: 3,
      categoryId: 'cat2',
      words: ['口水', '门口', '人口'],
      sentences: ['学校门口有很多人。', '这个城市人口很多。'],
      synonyms: ['嘴', '嘴巴'],
      antonyms: ['眼', '耳'],
      originGlyph: '👄',
      originText: '「口」字就是一个方方的嘴巴，用来吃饭、说话。',
      story: '我是小兔！我这张小嘴巴，最爱啃胡萝卜，嘎嘣嘎嘣真好吃！',
      storyEmoji: '👄',
      wordEmojis: ['🤤', '🚪', '👥'],
      strokeOrder: '竖、横折、横',
      riddle: {q: '一张小门帘，开在脸中间，吃饭又说话，天天都上班。', a: '口', hint: '用来说话吃东西'}
    },
    {
      id: 'c009',
      char: '手',
      pinyin: 'shǒu',
      tone: 3,
      categoryId: 'cat2',
      words: ['手机', '手指', '双手'],
      sentences: ['我的手机没电了。', '他用双手接过礼物。'],
      synonyms: ['手掌', '双手'],
      antonyms: ['脚', '足'],
      originGlyph: '✋',
      originText: '「手」字就像张开五根手指的样子，用来拿东西。',
      story: '我是小兔！我的小手短短的，抱起大萝卜一点也不费劲！',
      storyEmoji: '✋',
      wordEmojis: ['📱', '💡', '🤝'],
      strokeOrder: '撇、横、横、竖钩',
      riddle: {q: '十个小朋友，分成两排坐，做事全靠它，吃饭它先摸。', a: '手', hint: '长在胳膊最前面'}
    },
    {
      id: 'c010',
      char: '足',
      pinyin: 'zú',
      tone: 2,
      categoryId: 'cat2',
      words: ['足球', '满足', '手足'],
      sentences: ['我喜欢踢足球。', '他对现在的生活很满足。'],
      synonyms: ['脚', '脚'],
      antonyms: ['手', '掌'],
      originGlyph: '🦶',
      originText: '「足」字下面像脚，表示脚和走路。',
      story: '我是小兔！我的小脚丫蹦蹦跳，一下就跳到萝卜地里去啦！',
      storyEmoji: '🦶',
      wordEmojis: ['⚽', '😊', '🤝'],
      strokeOrder: '竖、横折、横、竖、横、撇、捺',
      riddle: {q: '两只小船真奇妙，不在水里地上跑，走路跑步都靠它，人人都有两只。', a: '足', hint: '用来走路的'}
    },
    {
      id: 'c011',
      char: '一',
      pinyin: 'yī',
      tone: 1,
      categoryId: 'cat3',
      words: ['一个', '一起', '第一'],
      sentences: ['我有一个好朋友。', '我们一起去玩吧。'],
      synonyms: ['壹', '单'],
      antonyms: ['十', '百'],
      originGlyph: '➖',
      originText: '「一」字就是一道横，表示数目里最小的一个。',
      story: '我是小兔！一就是一根胡萝卜，独独的一根，谁也抢不走！',
      storyEmoji: '➖',
      wordEmojis: ['1️⃣', '👫', '🔝'],
      strokeOrder: '横',
      riddle: {q: '一根小木棍，横在纸当中，数比它最小，排队它打头。', a: '一', hint: '数字里最小的'}
    },
    {
      id: 'c012',
      char: '二',
      pinyin: 'èr',
      tone: 4,
      categoryId: 'cat3',
      words: ['二月', '第二', '二手'],
      sentences: ['二月有二十八天。', '他得了第二名。'],
      synonyms: ['两', '贰'],
      antonyms: ['一', '三'],
      originGlyph: '2️⃣',
      originText: '「二」字是两道横，表示数目二。',
      story: '我是小兔！二就是两根胡萝卜，一根给妈妈，一根留给我！',
      storyEmoji: '2️⃣',
      wordEmojis: ['2️⃣', '🔝', '♻️'],
      strokeOrder: '横、横',
      riddle: {q: '一根变两根，横着排成行，数目排老二，紧跟着一旁。', a: '二', hint: '比一多一个'}
    },
    {
      id: 'c013',
      char: '三',
      pinyin: 'sān',
      tone: 1,
      categoryId: 'cat3',
      words: ['三个', '三月', '三角'],
      sentences: ['我有三个苹果。', '三月的天气很暖和。'],
      synonyms: ['叁', '仨'],
      antonyms: ['二', '四'],
      originGlyph: '3️⃣',
      originText: '「三」字是三道横，表示数目三。',
      story: '我是小兔！三就是三根胡萝卜，我、妈妈、爸爸，一人一根刚刚好！',
      storyEmoji: '3️⃣',
      wordEmojis: ['3️⃣', '📅', '🔺'],
      strokeOrder: '横、横、横',
      riddle: {q: '一横加两横，三横排整齐，数目排第三，跟着二兄弟。', a: '三', hint: '比二多一个'}
    },
    {
      id: 'c014',
      char: '十',
      pinyin: 'shí',
      tone: 2,
      categoryId: 'cat3',
      words: ['十个', '十分', '十月'],
      sentences: ['我有十个手指。', '他十分高兴。'],
      synonyms: ['拾', '十'],
      antonyms: ['一', '零'],
      originGlyph: '🔟',
      originText: '「十」字是一横一竖，表示数目十。',
      story: '我是小兔！十就是十根小胡萝卜，数呀数，数得我眼睛花！',
      storyEmoji: '🔟',
      wordEmojis: ['🔟', '💯', '📅'],
      strokeOrder: '横、竖',
      riddle: {q: '一横一竖交叉站，数目凑成一打半，手指刚好数得完。', a: '十', hint: '一个巴掌加五个'}
    },
    {
      id: 'c015',
      char: '爸',
      pinyin: 'bà',
      tone: 4,
      categoryId: 'cat4',
      words: ['爸爸', '老爸', '爸妈'],
      sentences: ['爸爸在看电视。', '爸妈一起去上班。'],
      synonyms: ['父亲', '爹'],
      antonyms: ['妈', '母亲'],
      originGlyph: '👨',
      originText: '「爸」字上面是父（爸爸），下面是巴，叫起来就是爸爸。',
      story: '我是小兔！兔爸爸力气大，一把抱起我转圈圈，好好玩！',
      storyEmoji: '👨',
      wordEmojis: ['👨', '👴', '👪'],
      strokeOrder: '撇、点、撇、捺、横折、竖、横、竖、横折、横、竖弯钩',
      riddle: {q: '胡子里有想法，肩膀宽宽力气大，把我举高高，叫我小娃娃。', a: '爸', hint: '家里叫他"父亲"'}
    },
    {
      id: 'c016',
      char: '妈',
      pinyin: 'mā',
      tone: 1,
      categoryId: 'cat4',
      words: ['妈妈', '老妈', '大妈'],
      sentences: ['妈妈在做饭。', '大妈跳广场舞。'],
      synonyms: ['母亲', '娘'],
      antonyms: ['爸', '父亲'],
      originGlyph: '👩',
      originText: '「妈」字左边是女（女人），右边是马，叫起来就是妈妈。',
      story: '我是小兔！兔妈妈最温柔，每天给我做胡萝卜蛋糕吃！',
      storyEmoji: '👩',
      wordEmojis: ['👩', '👵', '👵'],
      strokeOrder: '撇点、撇、横、横折、竖折折钩、横',
      riddle: {q: '长发飘飘笑眯眯，做饭洗衣疼娃娃，家里管事她第一。', a: '妈', hint: '和"爸"是一对'}
    },
    {
      id: 'c017',
      char: '哥',
      pinyin: 'gē',
      tone: 1,
      categoryId: 'cat4',
      words: ['哥哥', '大哥', '哥们'],
      sentences: ['哥哥比我大三岁。', '大哥很照顾我。'],
      synonyms: ['兄长', '兄'],
      antonyms: ['弟', '弟弟'],
      originGlyph: '👦',
      originText: '「哥」字是两个可，表示比自己大的男孩子。',
      story: '我是小兔！兔哥哥保护我，有大灰狼来，他挡在前面真勇敢！',
      storyEmoji: '👦',
      wordEmojis: ['👦', '🧍', '🤝'],
      strokeOrder: '横、竖、横折、横、竖、横、竖、横折、横、竖、横',
      riddle: {q: '两个小人叠一块，上面下面都叫可，比你年长男孩子，保护弟弟最实在。', a: '哥', hint: '家里年长的男孩'}
    },
    {
      id: 'c018',
      char: '狗',
      pinyin: 'gǒu',
      tone: 3,
      categoryId: 'cat5',
      words: ['小狗', '狗狗', '狗粮'],
      sentences: ['我家有一只小狗。', '小狗喜欢吃骨头。'],
      synonyms: ['犬', '狗狗'],
      antonyms: ['猫', '猫咪'],
      originGlyph: '🐶',
      originText: '「狗」字左边是犭（动物），右边是句，表示一种会看门的小动物。',
      story: '我是小兔！小狗汪汪是我的好朋友，我们一起追蝴蝶玩！',
      storyEmoji: '🐶',
      wordEmojis: ['🐶', '🐕', '🦴'],
      strokeOrder: '撇、弯钩、撇、撇、横折钩、竖、横折、横',
      riddle: {q: '摇着尾巴汪汪叫，看家护院它最妙，骨头最爱啃，看见主人跳。', a: '狗', hint: '和"猫"是邻居'}
    },
    {
      id: 'c019',
      char: '猫',
      pinyin: 'māo',
      tone: 1,
      categoryId: 'cat5',
      words: ['小猫', '猫咪', '猫粮'],
      sentences: ['小猫喜欢吃鱼。', '猫咪在睡觉。'],
      synonyms: ['猫咪', '喵'],
      antonyms: ['狗', '犬'],
      originGlyph: '🐱',
      originText: '「猫」字左边是犭（动物），右边是苗，表示一种会抓老鼠的小动物。',
      story: '我是小兔！小猫喵喵爱睡觉，蜷成一个球，可爱得我想摸摸！',
      storyEmoji: '🐱',
      wordEmojis: ['🐱', '😺', '🍖'],
      strokeOrder: '撇、弯钩、撇、横、竖、竖、竖、横折、横、竖、横',
      riddle: {q: '胡子两边翘，走路静悄悄，抓住小老鼠，喵喵叫一叫。', a: '猫', hint: '和"狗"是邻居'}
    },
    {
      id: 'c020',
      char: '米',
      pinyin: 'mǐ',
      tone: 3,
      categoryId: 'cat6',
      words: ['米饭', '大米', '小米'],
      sentences: ['我喜欢吃米饭。', '大米是主食。'],
      synonyms: ['大米', '稻米'],
      antonyms: ['面', '面粉'],
      originGlyph: '🌾',
      originText: '「米」字上面是禾（庄稼），中间是十，表示一粒粒的粮食。',
      story: '我是小兔！白白的米饭香喷喷，我一碗接一碗，撑成小圆球！',
      storyEmoji: '🌾',
      wordEmojis: ['🍚', '🌾', '🌾'],
      strokeOrder: '点、撇、横、竖、撇、捺、撇、捺',
      riddle: {q: '小小颗粒白又白，煮成饭来香又香，农民伯伯种出来。', a: '米', hint: '每天吃的主食'}
    }
  ],

  pinyin: {
    initials: [
      { letter: 'b', name: 'bō' },
      { letter: 'p', name: 'pō' },
      { letter: 'm', name: 'mō' },
      { letter: 'f', name: 'fō' },
      { letter: 'd', name: 'dē' },
      { letter: 't', name: 'tē' },
      { letter: 'n', name: 'nē' },
      { letter: 'l', name: 'lē' },
      { letter: 'g', name: 'gē' },
      { letter: 'k', name: 'kē' },
      { letter: 'h', name: 'hē' },
      { letter: 'j', name: 'jī' },
      { letter: 'q', name: 'qī' },
      { letter: 'x', name: 'xī' },
      { letter: 'zh', name: 'zhī' },
      { letter: 'ch', name: 'chī' },
      { letter: 'sh', name: 'shī' },
      { letter: 'r', name: 'rī' },
      { letter: 'z', name: 'zī' },
      { letter: 'c', name: 'cī' },
      { letter: 's', name: 'sī' },
      { letter: 'y', name: 'yī' },
      { letter: 'w', name: 'wū' }
    ],
    finals: {
      simple: [
        { letter: 'a', name: 'a', type: '单韵母' },
        { letter: 'o', name: 'o', type: '单韵母' },
        { letter: 'e', name: 'e', type: '单韵母' },
        { letter: 'i', name: 'i', type: '单韵母' },
        { letter: 'u', name: 'u', type: '单韵母' },
        { letter: 'ü', name: 'ü', type: '单韵母' }
      ],
      compound: [
        { letter: 'ai', name: 'ai', type: '复韵母' },
        { letter: 'ei', name: 'ei', type: '复韵母' },
        { letter: 'ui', name: 'ui', type: '复韵母' },
        { letter: 'ao', name: 'ao', type: '复韵母' },
        { letter: 'ou', name: 'ou', type: '复韵母' },
        { letter: 'iu', name: 'iu', type: '复韵母' },
        { letter: 'ie', name: 'ie', type: '复韵母' },
        { letter: 'üe', name: 'üe', type: '复韵母' },
        { letter: 'er', name: 'er', type: '复韵母' }
      ],
      nasal: [
        { letter: 'an', name: 'an', type: '鼻韵母' },
        { letter: 'en', name: 'en', type: '鼻韵母' },
        { letter: 'in', name: 'in', type: '鼻韵母' },
        { letter: 'un', name: 'un', type: '鼻韵母' },
        { letter: 'ün', name: 'ün', type: '鼻韵母' },
        { letter: 'ang', name: 'ang', type: '鼻韵母' },
        { letter: 'eng', name: 'eng', type: '鼻韵母' },
        { letter: 'ing', name: 'ing', type: '鼻韵母' },
        { letter: 'ong', name: 'ong', type: '鼻韵母' }
      ]
    }
  },

  storybooks: [
  {
    "_id": "sb_1a_识字01",
    "title": "天地人",
    "source": "部编版1年级上册",
    "lesson_type": "识字",
    "lesson_num": 1,
    "grade": "1上",
    "order": 1,
    "pages": [
      {
        "page_num": 1,
        "text": "天地人，你我他",
        "characters": [
          "人",
          "他",
          "你",
          "地",
          "天",
          "我"
        ],
        "image_prompt": "blue sky, 3D clay animation style, cute, warm pastel colors, simple clean light beige background, kids friendly educational illustration, no text, no Chinese characters, soft lighting, adorable characters",
        "image_url": "assets/images/storybooks/sb_1a_识字01_1.png",
        "audio_url": "assets/audio/storybooks/sb_1a_识字01_1.wav",
        "char_cards": [
          {
            "character": "人",
            "pinyin": "ren2",
            "word": "人们",
            "_id": "c111"
          },
          {
            "character": "他",
            "pinyin": "ta1",
            "word": "他们",
            "_id": "c114"
          },
          {
            "character": "你",
            "pinyin": "ni3",
            "word": "你好",
            "_id": "c112"
          },
          {
            "character": "地",
            "pinyin": "di4",
            "word": "大地",
            "_id": "c002"
          },
          {
            "character": "天",
            "pinyin": "tian1",
            "word": "天上",
            "_id": "c001"
          },
          {
            "character": "我",
            "pinyin": "wo3",
            "word": "我们",
            "_id": "c113"
          }
        ]
      }
    ],
    "total_pages": 1,
    "status": "active",
    "difficulty_score": 19.6,
    "difficulty_reason": "识字，总字数6，平均每页6字，生字密度100%",
    "difficulty": "L1",
    "id": "sb_1a_识字01"
  }
,
  {
    "_id": "sb_1a_识字02",
    "title": "金木水火土",
    "source": "部编版1年级上册",
    "lesson_type": "识字",
    "lesson_num": 2,
    "grade": "1上",
    "order": 2,
    "pages": [
      {
        "page_num": 1,
        "text": "一 二 三 四 五 ，金 木 水 火 土 。",
        "characters": [
          "一",
          "三",
          "二",
          "五",
          "四",
          "土",
          "木",
          "水",
          "火",
          "金"
        ],
        "image_prompt": "clear water, 3D clay animation style, cute, warm pastel colors, simple clean light beige background, kids friendly educational illustration, no text, no Chinese characters, soft lighting, adorable characters",
        "image_url": "assets/images/storybooks/sb_1a_识字02_1.png",
        "audio_url": "assets/audio/storybooks/sb_1a_识字02_1.wav",
        "char_cards": [
          {
            "character": "一",
            "pinyin": "yi1",
            "word": "一个",
            "_id": "c048"
          },
          {
            "character": "三",
            "pinyin": "san1",
            "word": "三个",
            "_id": "c050"
          },
          {
            "character": "二",
            "pinyin": "er4",
            "word": "二月",
            "_id": "c049"
          },
          {
            "character": "五",
            "pinyin": "wu3",
            "word": "五月",
            "_id": "c052"
          },
          {
            "character": "四",
            "pinyin": "si4",
            "word": "四方",
            "_id": "c051"
          },
          {
            "character": "土",
            "pinyin": "tu3",
            "word": "",
            "_id": ""
          },
          {
            "character": "木",
            "pinyin": "mu4",
            "word": "木头",
            "_id": "c097"
          },
          {
            "character": "水",
            "pinyin": "shui3",
            "word": "喝水",
            "_id": "c005"
          },
          {
            "character": "火",
            "pinyin": "huo3",
            "word": "火车",
            "_id": "c006"
          },
          {
            "character": "金",
            "pinyin": "jin1",
            "word": "金",
            "_id": "char_金"
          }
        ]
      },
      {
        "page_num": 2,
        "text": "天 地 分 上 下 ，日 月 照 今 古 。",
        "characters": [
          "上",
          "下",
          "今",
          "分",
          "古",
          "地",
          "天",
          "日",
          "月",
          "照"
        ],
        "image_prompt": "bright sun, crescent moon, 3D clay animation style, cute, warm pastel colors, simple clean light beige background, kids friendly educational illustration, no text, no Chinese characters, soft lighting, adorable characters",
        "image_url": "assets/images/storybooks/sb_1a_识字02_2.png",
        "audio_url": "assets/audio/storybooks/sb_1a_识字02_2.wav",
        "char_cards": [
          {
            "character": "上",
            "pinyin": "shang4",
            "word": "上面",
            "_id": "c061"
          },
          {
            "character": "下",
            "pinyin": "xia4",
            "word": "下面",
            "_id": "c062"
          },
          {
            "character": "分",
            "pinyin": "fen1",
            "word": "分",
            "_id": "char_分"
          },
          {
            "character": "古",
            "pinyin": "gu3",
            "word": "古",
            "_id": "char_古"
          },
          {
            "character": "地",
            "pinyin": "di4",
            "word": "大地",
            "_id": "c002"
          },
          {
            "character": "天",
            "pinyin": "tian1",
            "word": "天上",
            "_id": "c001"
          },
          {
            "character": "日",
            "pinyin": "ri4",
            "word": "日子",
            "_id": "c003"
          },
          {
            "character": "月",
            "pinyin": "yue4",
            "word": "月亮",
            "_id": "c004"
          },
          {
            "character": "照",
            "pinyin": "zhao4",
            "word": "照",
            "_id": "char_照"
          }
        ]
      }
    ],
    "total_pages": 2,
    "status": "active",
    "difficulty_score": 30.0,
    "difficulty_reason": "识字，总字数20，平均每页10字，生字密度100%",
    "difficulty": "L1",
    "id": "sb_1a_识字02"
  },
  {
    "_id": "sb_1a_识字03",
    "title": "口耳目",
    "source": "部编版1年级上册",
    "lesson_type": "识字",
    "lesson_num": 3,
    "grade": "1上",
    "order": 3,
    "pages": [
      {
        "page_num": 1,
        "text": "耳目口手足站 如 松 ， 坐 如 钟 。",
        "characters": [
          "口",
          "坐",
          "如",
          "手",
          "松",
          "目",
          "站",
          "耳",
          "足",
          "钟"
        ],
        "image_prompt": "a warm cozy scene with cute clay characters, 3D clay animation style, cute, warm pastel colors, simple clean light beige background, kids friendly educational illustration, no text, no Chinese characters, soft lighting, adorable characters",
        "image_url": "assets/images/storybooks/sb_1a_识字03_1.png",
        "audio_url": "assets/audio/storybooks/sb_1a_识字03_1.wav",
        "char_cards": [
          {
            "character": "口",
            "pinyin": "kou3",
            "word": "口水",
            "_id": "c031"
          },
          {
            "character": "坐",
            "pinyin": "zuo4",
            "word": "坐下",
            "_id": "c145"
          },
          {
            "character": "如",
            "pinyin": "ru2",
            "word": "",
            "_id": ""
          },
          {
            "character": "手",
            "pinyin": "shou3",
            "word": "手指",
            "_id": "c034"
          },
          {
            "character": "松",
            "pinyin": "song1",
            "word": "",
            "_id": ""
          },
          {
            "character": "目",
            "pinyin": "mu4",
            "word": "目光",
            "_id": "c033"
          },
          {
            "character": "站",
            "pinyin": "zhan4",
            "word": "站起",
            "_id": "c144"
          },
          {
            "character": "耳",
            "pinyin": "er3",
            "word": "耳朵",
            "_id": "c032"
          },
          {
            "character": "足",
            "pinyin": "zu2",
            "word": "足球",
            "_id": "c035"
          },
          {
            "character": "钟",
            "pinyin": "zhong1",
            "word": "钟",
            "_id": "char_钟"
          }
        ]
      },
      {
        "page_num": 2,
        "text": "行 如 风 ， 卧 如 弓 。",
        "characters": [
          "卧",
          "如",
          "弓",
          "行",
          "风"
        ],
        "image_prompt": "a warm cozy scene with cute clay characters, 3D clay animation style, cute, warm pastel colors, simple clean light beige background, kids friendly educational illustration, no text, no Chinese characters, soft lighting, adorable characters",
        "image_url": "assets/images/storybooks/sb_1a_识字03_2.png",
        "audio_url": "assets/audio/storybooks/sb_1a_识字03_2.wav",
        "char_cards": [
          {
            "character": "卧",
            "pinyin": "wo4",
            "word": "卧",
            "_id": "char_卧"
          },
          {
            "character": "如",
            "pinyin": "ru2",
            "word": "",
            "_id": ""
          },
          {
            "character": "行",
            "pinyin": "xing2",
            "word": "行",
            "_id": "char_行"
          },
          {
            "character": "风",
            "pinyin": "feng1",
            "word": "大风",
            "_id": "c013"
          }
        ]
      }
    ],
    "total_pages": 2,
    "status": "active",
    "difficulty_score": 25.2,
    "difficulty_reason": "识字，总字数17，平均每页8字，生字密度82%",
    "difficulty": "L1",
    "id": "sb_1a_识字03"
  }
],

  stats: {
    totalLearned: 128,
    streakDays: 7,
    totalWords: 1343,
    practice: {
      image: { done: 86, total: 120, mastered: 65, wrong: 21 },
      audio: { done: 72, total: 100, mastered: 50, wrong: 22 },
      sentence: { done: 58, total: 90, mastered: 40, wrong: 18 },
      pinyin: { done: 95, total: 150, mastered: 70, wrong: 25 }
    }
  },

  lessons: [
    { id: 'lesson_1', name: '认识数字（一）', icon: '🔢', cardIds: ['c011', 'c012', 'c013'], requiredLesson: null, xpReward: 50, coinsReward: 20, description: '学习一、二、三这三个数字' },
    { id: 'lesson_2', name: '认识数字（二）', icon: '🔢', cardIds: ['c014'], requiredLesson: 'lesson_1', xpReward: 50, coinsReward: 20, description: '学习十字' },
    { id: 'lesson_3', name: '认识家人', icon: '👪', cardIds: ['c015', 'c016', 'c017'], requiredLesson: 'lesson_2', xpReward: 50, coinsReward: 20, description: '学习爸爸、妈妈、哥哥' },
    { id: 'lesson_4', name: '认识身体', icon: '🧠', cardIds: ['c006', 'c007', 'c008', 'c009', 'c010'], requiredLesson: 'lesson_3', xpReward: 50, coinsReward: 20, description: '学习眼睛、耳朵、嘴巴、手、脚' },
    { id: 'lesson_5', name: '认识自然', icon: '🏔️', cardIds: ['c001', 'c002', 'c003', 'c004', 'c005'], requiredLesson: 'lesson_4', xpReward: 50, coinsReward: 20, description: '学习山、水、日、月、花' },
    { id: 'lesson_6', name: '认识动物', icon: '🐱', cardIds: ['c018', 'c019'], requiredLesson: 'lesson_5', xpReward: 50, coinsReward: 20, description: '学习狗和猫' },
    { id: 'lesson_7', name: '认识食物', icon: '🍚', cardIds: ['c020'], requiredLesson: 'lesson_6', xpReward: 50, coinsReward: 20, description: '学习米字' },
    { id: 'lesson_8', name: '认识衣物', icon: '👕', cardIds: [], requiredLesson: 'lesson_7', xpReward: 50, coinsReward: 20, description: '学习常见衣物' },
    { id: 'lesson_9', name: '认识建筑', icon: '🏠', cardIds: [], requiredLesson: 'lesson_8', xpReward: 50, coinsReward: 20, description: '学习建筑相关' },
    { id: 'lesson_10', name: '认识工具', icon: '🔧', cardIds: [], requiredLesson: 'lesson_9', xpReward: 50, coinsReward: 20, description: '学习常用工具' }
  ]
};
