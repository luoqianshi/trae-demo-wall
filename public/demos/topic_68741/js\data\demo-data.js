window.DemoData = {
  categories: [
    { id: 'cat1', name: '自然世界', emoji: '🌿', totalChars: 22, progress: 30 },
    { id: 'cat2', name: '身体部位', emoji: '👤', totalChars: 18, progress: 50 },
    { id: 'cat3', name: '数字量词', emoji: '🔢', totalChars: 15, progress: 40 },
    { id: 'cat4', name: '家人称呼', emoji: '👨‍👩‍👧', totalChars: 12, progress: 60 },
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
      antonyms: ['水', '川']
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
      antonyms: ['山', '火']
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
      antonyms: ['月', '夜']
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
      antonyms: ['日', '太阳']
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
      antonyms: ['草', '叶']
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
      antonyms: ['耳', '嘴']
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
      antonyms: ['眼', '目']
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
      antonyms: ['眼', '耳']
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
      antonyms: ['脚', '足']
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
      antonyms: ['手', '掌']
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
      antonyms: ['十', '百']
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
      antonyms: ['一', '三']
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
      antonyms: ['二', '四']
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
      antonyms: ['一', '零']
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
      antonyms: ['妈', '母亲']
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
      antonyms: ['爸', '父亲']
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
      antonyms: ['弟', '弟弟']
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
      antonyms: ['猫', '猫咪']
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
      antonyms: ['狗', '犬']
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
      antonyms: ['面', '面粉']
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
    { id: 'sb001', title: '小猫钓鱼', grade: '一年级L1', difficulty: '简单', pages: 12, coverEmoji: '🐱' },
    { id: 'sb002', title: '三只小猪', grade: '一年级L1', difficulty: '简单', pages: 16, coverEmoji: '🐷' },
    { id: 'sb003', title: '拔萝卜', grade: '一年级L1', difficulty: '简单', pages: 10, coverEmoji: '🥕' },
    { id: 'sb004', title: '小蝌蚪找妈妈', grade: '一年级L1', difficulty: '中等', pages: 18, coverEmoji: '🐸' },
    { id: 'sb005', title: '龟兔赛跑', grade: '一年级L1', difficulty: '中等', pages: 20, coverEmoji: '🐢' },
    { id: 'sb006', title: '狼来了', grade: '一年级L1', difficulty: '中等', pages: 15, coverEmoji: '🐺' },
    { id: 'sb007', title: '守株待兔', grade: '一年级L1', difficulty: '困难', pages: 22, coverEmoji: '🌳' },
    { id: 'sb008', title: '亡羊补牢', grade: '一年级L1', difficulty: '困难', pages: 24, coverEmoji: '🐑' }
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
  }
};
