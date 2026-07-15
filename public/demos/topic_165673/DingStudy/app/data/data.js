// =====================================================
//  叮咚学 · 数据文件
//  年级 / 教材版本 / 学科 / 题目 / 字词典 / 成就定义
// =====================================================

// ---- 年级 ----
const GRADES = [
  { id: 'pre',  name: '学前班' },
  { id: 'g1up', name: '一年级上册' },
  { id: 'g1dn', name: '一年级下册' },
  { id: 'g2up', name: '二年级上册' },
  { id: 'g2dn', name: '二年级下册' },
  { id: 'g3up', name: '三年级上册' },
  { id: 'g3dn', name: '三年级下册' },
  { id: 'g4up', name: '四年级上册' },
  { id: 'g4dn', name: '四年级下册' },
  { id: 'g5up', name: '五年级上册' },
  { id: 'g5dn', name: '五年级下册' },
  { id: 'g6up', name: '六年级上册' },
  { id: 'g6dn', name: '六年级下册' },
  { id: 'g7up', name: '七年级上册' },
  { id: 'g7dn', name: '七年级下册' },
  { id: 'g8up', name: '八年级上册' },
  { id: 'g8dn', name: '八年级下册' },
  { id: 'g9up', name: '九年级上册' },
  { id: 'g9dn', name: '九年级下册' },
];

// ---- 教材版本 ----
const VERSIONS = [
  { id: 'pep',  name: '人教版' },
  { id: 'bsd',  name: '北师大版' },
  { id: 'sjjy', name: '苏教版' },
  { id: 'jy',   name: '教科版' },
  { id: 'sd',   name: '沪教版' },
  { id: 'cb',   name: '沪科版' },
  { id: 'wys',  name: '外研版' },
  { id: 'qdp',  name: '青岛版' },
];

// ---- 学科 ----
const SUBJECTS = [
  { id: 'chinese',  name: '语文', emoji: '📖', sub: ['人教版','北师大版','苏教版'] },
  { id: 'math',     name: '数学', emoji: '🧮', sub: ['人教版','北师大版','苏教版'] },
  { id: 'english',  name: '英语', emoji: '🔤', sub: ['人教版','外研版','沪教版'] },
  { id: 'science',  name: '科学', emoji: '🔬', sub: ['教科版','苏教版','青岛版'],
    tags: ['化学','生物','物理'] },
  { id: 'politics', name: '政治', emoji: '🏛️', sub: ['人教版','教科版'] },
  { id: 'history',  name: '历史', emoji: '📜', sub: ['人教版','北师大版'] },
  { id: 'music',    name: '音乐', emoji: '🎵', sub: ['人教版','沪教版'] },
  { id: 'art',      name: '美术', emoji: '🎨', sub: ['人教版','苏教版'] },
];

// ---- 成就 ----
const ACHIEVEMENTS = [
  { id: 'first_correct', emoji: '🌟', name: '初次答对', desc: '答对第一道题', check: (s) => s.stats.correct >= 1 },
  { id: 'combo_5',       emoji: '⚡', name: '小试牛刀', desc: '连击 5 次',     check: (s) => s.stats.maxCombo >= 5 },
  { id: 'combo_10',      emoji: '🔥', name: '连击大师', desc: '连击 10 次',    check: (s) => s.stats.maxCombo >= 10 },
  { id: 'streak_3',      emoji: '📅', name: '三天打鱼', desc: '连胜 3 天',     check: (s) => s.streak >= 3 },
  { id: 'streak_7',      emoji: '🗓️', name: '一周学霸', desc: '连胜 7 天',     check: (s) => s.streak >= 7 },
  { id: 'all_subject',   emoji: '🎓', name: '全能选手', desc: '8 个学科都进过', check: (s) => Object.keys(s.visited || {}).length >= 8 },
  { id: 'correct_50',    emoji: '💯', name: '百题斩',   desc: '答对 50 题',    check: (s) => s.stats.correct >= 50 },
  { id: 'review_3',      emoji: '🧠', name: '复习小能手', desc: '复习 3 次',   check: (s) => (s.stats.reviews || 0) >= 3 },
  { id: 'map_1',         emoji: '🗺️', name: '造图新手', desc: '造 1 张地图',  check: (s) => (s.maps || []).length >= 1 },
  { id: 'app_1',         emoji: '🧩', name: '造应用',   desc: '造 1 个应用',   check: (s) => (s.apps || []).length >= 1 },
  { id: 'post_1',        emoji: '✍️', name: '广场新人', desc: '发 1 条动态',  check: (s) => (s.posts || 0) >= 1 },
  { id: 'rich',          emoji: '💎', name: '叮咚富翁', desc: '叮咚币 ≥ 200', check: (s) => s.coin >= 200 },
];

// =====================================================
//  题库（每个学科 30+ 道，作为样例）
//  每题：{ q, opts: [], a, exp: 讲解, level }
// =====================================================

const QUESTIONS = {
  // ---- 语文 ----
  chinese: [
    { q: "下面哪个字的拼音是 'xué'？", opts: ['学','雪','行','新'], a: 0, exp: "'学'的拼音是 xué，表示学习的意思。'雪'是 xuě。'行'可以读 xíng 或 háng。'新'是 xīn。" },
    { q: "《静夜思》的作者是谁？", opts: ['李白','杜甫','王维','白居易'], a: 0, exp: "《静夜思》是唐代大诗人李白所作，写的是夜晚思念家乡的情感。" },
    { q: "下面哪个是比喻句？", opts: ['太阳升起来了。','弯弯的月亮像小船。','今天很热。','他在笑。'], a: 1, exp: "比喻句要有本体和喻体，'月亮'是本体，'小船'是喻体，中间用'像'连接。" },
    { q: "'春天来了，小草从土里钻出来。'中'钻'的意思是？", opts: ['用工具打洞','穿过、冒出','寻找','挖掘'], a: 1, exp: "这里的'钻'是拟人化的用法，意思是小草像人一样冒出来、钻出来。" },
    { q: "下面哪个词语没有错别字？", opts: ['再接再厉','再接再励','再接再立','再接再厉'], a: 0, exp: "正确写法是'再接再厉'，'厉'是磨砺的意思，鼓励继续努力。" },
    { q: "《登鹳雀楼》'欲穷千里目'的下一句是？", opts: ['黄河入海流','更上一层楼','白日依山尽','千里江陵一日还'], a: 1, exp: "正确是'更上一层楼'。出自王之涣《登鹳雀楼》。" },
    { q: "下面哪个是反义词？", opts: ['高大-矮小','苹果-红色','跑-跑步','春天-鲜花'], a: 0, exp: "反义词是意思相反的词。'高大'和'矮小'是反义词。" },
    { q: "把句子补充完整：'妈妈____。'", opts: ['在厨房做饭','苹果和香蕉','很高兴地跳','学习很努力'], a: 0, exp: "句子要有主语和谓语，'妈妈在厨房做饭'是完整句子。" },
    { q: "下面哪个成语用来形容人很多？", opts: ['寥寥无几','人山人海','屈指可数','孤掌难鸣'], a: 1, exp: "'人山人海'形容人聚集得非常多。" },
    { q: "'书籍是人类进步的阶梯。'这句话运用了什么修辞？", opts: ['比喻','拟人','夸张','排比'], a: 0, exp: "把'书籍'比作'阶梯'，是比喻句。" },
  ],
  // ---- 数学 ----
  math: [
    { q: "1 + 1 = ?", opts: ['1','2','3','4'], a: 1, exp: "1 加 1 等于 2。" },
    { q: "5 × 6 = ?", opts: ['11','30','56','60'], a: 1, exp: "5 乘 6 等于 30。" },
    { q: "12 ÷ 4 = ?", opts: ['2','3','4','6'], a: 1, exp: "12 除以 4 等于 3。" },
    { q: "一个三角形有几个角？", opts: ['2','3','4','5'], a: 1, exp: "三角形有 3 个角。" },
    { q: "下列哪个是偶数？", opts: ['3','5','7','8'], a: 3, exp: "能被 2 整除的是偶数，8 是偶数。" },
    { q: "1 小时 = ? 分钟", opts: ['30','50','60','100'], a: 2, exp: "1 小时等于 60 分钟。" },
    { q: "圆的周长公式是？", opts: ['2πr','πr²','πr','2π'], a: 0, exp: "圆的周长 C = 2πr。" },
    { q: "0.5 + 0.5 = ?", opts: ['0','1','0.25','1.5'], a: 1, exp: "0.5 + 0.5 = 1.0" },
    { q: "100 - 37 = ?", opts: ['63','67','73','57'], a: 0, exp: "100 减 37 等于 63。" },
    { q: "长方形面积公式是？", opts: ['长+宽','长×宽','长×高','2×长+2×宽'], a: 1, exp: "长方形面积 S = 长 × 宽。" },
  ],
  // ---- 英语 ----
  english: [
    { q: "apple 的中文是？", opts: ['苹果','香蕉','橘子','葡萄'], a: 0, exp: "apple = 苹果 🍎" },
    { q: "'hello' 的中文是？", opts: ['再见','你好','谢谢','对不起'], a: 1, exp: "hello = 你好" },
    { q: "cat 的中文是？", opts: ['狗','猫','鸟','鱼'], a: 1, exp: "cat = 猫 🐱" },
    { q: "'book' 是什么意思？", opts: ['书','本子','笔','书包'], a: 0, exp: "book = 书" },
    { q: "I ___ a student.", opts: ['am','is','are','be'], a: 0, exp: "主语是 I，用 am。I am a student." },
    { q: "How are you?", opts: ['Hello','I am fine, thank you.','Goodbye','See you'], a: 1, exp: "回答是 I am fine, thank you." },
    { q: "red 的中文是？", opts: ['红色','蓝色','绿色','黄色'], a: 0, exp: "red = 红色" },
    { q: "She ___ a girl.", opts: ['am','is','are','be'], a: 1, exp: "主语是 She，用 is。" },
    { q: "'thank you' 是什么意思？", opts: ['谢谢','对不起','没关系','请'], a: 0, exp: "thank you = 谢谢" },
    { q: "What is this? - ___ is a pen.", opts: ['This','It','That','He'], a: 1, exp: "回答用 It，It is a pen." },
  ],
  // ---- 科学（含化学/生物/物理） ----
  science: [
    { q: "水的化学式是？", opts: ['H2O','CO2','O2','NaCl'], a: 0, exp: "水 = H₂O，由 2 个氢原子和 1 个氧原子组成。" },
    { q: "光在真空中的速度约为？", opts: ['3×10⁵ km/s','3×10⁸ m/s','3×10⁶ m/s','3×10¹⁰ m/s'], a: 1, exp: "光速约 3×10⁸ m/s，是宇宙中最快的速度。" },
    { q: "植物通过什么过程产生氧气？", opts: ['呼吸作用','光合作用','蒸腾作用','吸收作用'], a: 1, exp: "光合作用：植物吸收 CO₂ 和水，在光下产生葡萄糖和氧气。" },
    { q: "下列哪个是哺乳动物？", opts: ['青蛙','蛇','鲸鱼','鲨鱼'], a: 2, exp: "鲸鱼是哺乳动物，胎生、哺乳、用肺呼吸。" },
    { q: "NaCl 的中文名是？", opts: ['氯化钠','氯化钾','碳酸钠','氢氧化钠'], a: 0, exp: "NaCl 是氯化钠，也就是我们每天吃的食盐。" },
    { q: "下列哪个力是重力？", opts: ['磁力','摩擦力','地球对物体的吸引力','弹力'], a: 2, exp: "重力是地球对物体的吸引力，方向竖直向下。" },
    { q: "DNA 主要存在于细胞的哪个结构中？", opts: ['细胞核','线粒体','核糖体','细胞膜'], a: 0, exp: "DNA 主要在细胞核中，线粒体中也有少量 DNA。" },
    { q: "声音在空气中传播速度约为？", opts: ['340 m/s','3400 m/s','34 m/s','34000 m/s'], a: 0, exp: "声速在空气中约 340 m/s。" },
    { q: "下列哪个是酸性溶液？", opts: ['肥皂水','柠檬汁','石灰水','小苏打水'], a: 1, exp: "柠檬汁含柠檬酸，pH < 7，是酸性。" },
    { q: "下列哪种动物属于无脊椎动物？", opts: ['鱼','鸟','蚂蚁','青蛙'], a: 2, exp: "蚂蚁是昆虫，没有脊椎骨。" },
  ],
  // ---- 政治 ----
  politics: [
    { q: "我国的根本政治制度是？", opts: ['人民代表大会制度','多党合作','民族区域自治','基层群众自治'], a: 0, exp: "人民代表大会制度是我国的根本政治制度。" },
    { q: "国旗上的五颗星代表什么？", opts: ['五位领袖','五个民族','全国人民大团结','五大洲'], a: 2, exp: "国旗上一颗大五角星代表中国共产党的领导，四颗小五角星代表全国各族人民的大团结。" },
    { q: "我国的首都是？", opts: ['上海','北京','广州','南京'], a: 1, exp: "首都是北京。" },
    { q: "公民最基本的权利是？", opts: ['人身权利','文化权利','经济权利','政治权利'], a: 0, exp: "人身权利是公民最基本的权利。" },
    { q: "我国共有多少个民族？", opts: ['52','54','56','58'], a: 2, exp: "我国共有 56 个民族。" },
  ],
  // ---- 历史 ----
  history: [
    { q: "中国第一个统一封建王朝是？", opts: ['汉','秦','唐','宋'], a: 1, exp: "秦始皇于公元前 221 年统一六国，建立秦朝。" },
    { q: "丝绸之路开辟于哪个朝代？", opts: ['秦','西汉','唐','宋'], a: 1, exp: "西汉汉武帝时期，张骞出使西域，开辟丝绸之路。" },
    { q: "火药最早用于军事是在？", opts: ['唐末宋初','元','明','清'], a: 0, exp: "火药在唐末宋初开始用于军事。" },
    { q: "《史记》的作者是？", opts: ['司马迁','司马光','孔子','孟子'], a: 0, exp: "司马迁撰写了中国第一部纪传体通史《史记》。" },
    { q: "鸦片战争发生在哪一年？", opts: ['1838','1840','1842','1856'], a: 1, exp: "1840 年爆发第一次鸦片战争。" },
  ],
  // ---- 音乐 ----
  music: [
    { q: "简谱中 '1' 唱作？", opts: ['do','re','mi','fa'], a: 0, exp: "1 = do，2 = re，3 = mi，4 = fa，5 = sol，6 = la，7 = si。" },
    { q: "钢琴有几个键？", opts: ['66','78','88','100'], a: 2, exp: "标准钢琴有 88 个键（52 个白键 + 36 个黑键）。" },
    { q: "下列哪个是中国民族乐器？", opts: ['小提琴','古筝','钢琴','吉他'], a: 1, exp: "古筝是中国传统民族乐器。" },
    { q: "do re mi fa sol la si 中，'sol' 是第几个？", opts: ['3','4','5','6'], a: 2, exp: "1 do, 2 re, 3 mi, 4 fa, 5 sol，sol 是第 5 个。" },
    { q: "《小星星》的拍号是？", opts: ['2/4','3/4','4/4','6/8'], a: 0, exp: "《小星星》是 2/4 拍。" },
  ],
  // ---- 美术 ----
  art: [
    { q: "三原色是哪三种颜色？", opts: ['红黄蓝','红绿蓝','黄绿紫','红橙黄'], a: 0, exp: "三原色是红、黄、蓝，不能由其他颜色混合得到。" },
    { q: "《蒙娜丽莎》的作者是？", opts: ['达芬奇','梵高','毕加索','米开朗基罗'], a: 0, exp: "《蒙娜丽莎》是意大利画家达芬奇的作品。" },
    { q: "国画中的'四君子'指？", opts: ['梅兰竹菊','松竹梅兰','梅松竹菊','兰竹松菊'], a: 0, exp: "四君子：梅、兰、竹、菊。" },
    { q: "中国画用的主要颜料是？", opts: ['水彩','油画','国画颜料','丙烯'], a: 2, exp: "中国画主要用国画颜料，分为矿物和植物颜料。" },
    { q: "下面哪种颜色是暖色？", opts: ['蓝色','绿色','红色','紫色'], a: 2, exp: "红色属于暖色，蓝色、绿色属于冷色。" },
  ],
};

// ---- 字典（万能字词典） ----
const DICT = {
  '学': { pinyin: 'xué', meaning: '学习；学问；学校', example: '我们要好好学习。', en: 'study; learning', near: ['教','习'], ant: ['教'] },
  '习': { pinyin: 'xí', meaning: '学习；习惯', example: '我养成了读书的习惯。', en: 'practice; habit', near: ['学'], ant: ['教'] },
  '叮': { pinyin: 'dīng', meaning: '叮嘱；叮咛', example: '妈妈叮我早点睡觉。', en: 'to urge', near: ['嘱'], ant: [] },
  '咚': { pinyin: 'dōng', meaning: '形容敲鼓或敲门的声音', example: '咚咚咚，有人敲门。', en: 'thud sound', near: [], ant: [] },
  '爱': { pinyin: 'ài', meaning: '喜爱；爱护', example: '我爱我的家人。', en: 'love', near: ['喜'], ant: ['恨'] },
  '书': { pinyin: 'shū', meaning: '书本；书写', example: '我爱看书。', en: 'book', near: ['本'], ant: [] },
  '水': { pinyin: 'shuǐ', meaning: '无色无味液体', example: '我们要节约用水。', en: 'water', near: [], ant: ['火'] },
  '火': { pinyin: 'huǒ', meaning: '火焰', example: '火可以取暖。', en: 'fire', near: [], ant: ['水'] },
  '山': { pinyin: 'shān', meaning: '山岳', example: '山高水长。', en: 'mountain', near: ['岳'], ant: [] },
  '日': { pinyin: 'rì', meaning: '太阳；日子', example: '今日天气很好。', en: 'sun; day', near: ['阳'], ant: ['月'] },
  '月': { pinyin: 'yuè', meaning: '月亮；月份', example: '月圆之夜。', en: 'moon; month', near: [], ant: ['日'] },
  'apple': { pinyin: '/ˈæp.əl/', meaning: '苹果', example: 'I eat an apple every day.', en: 'apple', near: ['banana','fruit'], ant: [] },
  'banana': { pinyin: '/bəˈnæn.ə/', meaning: '香蕉', example: 'Monkeys love bananas.', en: 'banana', near: ['apple','fruit'], ant: [] },
  'cat':    { pinyin: '/kæt/', meaning: '猫', example: 'The cat is cute.', en: 'cat', near: ['dog','pet'], ant: [] },
  'dog':    { pinyin: '/dɒɡ/', meaning: '狗', example: 'The dog runs fast.', en: 'dog', near: ['cat','pet'], ant: [] },
  'book':   { pinyin: '/bʊk/', meaning: '书', example: 'I read a book.', en: 'book', near: ['read','story'], ant: [] },
  'hello':  { pinyin: '/həˈləʊ/', meaning: '你好', example: 'Hello, how are you?', en: 'hello', near: ['hi','greeting'], ant: ['goodbye'] },
  'red':    { pinyin: '/red/', meaning: '红色', example: 'I like red apples.', en: 'red', near: ['color'], ant: [] },
  'blue':   { pinyin: '/bluː/', meaning: '蓝色', example: 'The sky is blue.', en: 'blue', near: ['color'], ant: [] },
  'love':   { pinyin: '/lʌv/', meaning: '爱', example: 'I love my mom.', en: 'love', near: ['like'], ant: ['hate'] },
};

// ---- 闯关地图模板（每个学科自动套用） ----
function makeMapNodes(subjectName) {
  return [
    { name: '第 1 关 · 起步', ic: '🌱', reward: 5 },
    { name: '第 2 关 · 进阶', ic: '🌿', reward: 8 },
    { name: '第 3 关 · 挑战', ic: '🌳', reward: 10 },
    { name: '第 4 关 · 高手', ic: '🌟', reward: 12 },
    { name: '第 5 关 · 大师', ic: '🏆', reward: 20 },
  ];
}

// ---- 每日任务模板 ----
function makeDailyTasks() {
  return [
    { id: 'd1', name: '完成 1 次答题', done: false, target: 1, prog: 0 },
    { id: 'd2', name: '答对 5 题',     done: false, target: 5, prog: 0 },
    { id: 'd3', name: '复习 1 个知识点', done: false, target: 1, prog: 0 },
    { id: 'd4', name: '进 1 个学科看看', done: false, target: 1, prog: 0 },
  ];
}

// ---- 活动（按日期） ----
const EVENTS = [
  { day: 1,  title: '🎉 开学大礼',  tip: '今日参与可领 30 叮咚币！' },
  { day: 15, title: '🏆 答题挑战赛', tip: '完成 1 套试卷可获双倍奖励' },
  { day: 25, title: '🎨 美术节',    tip: '上传你的画作 +50 叮咚币' },
];

// ---- 预制头像（emoji） ----
const PRESET_AVATARS = [
  '😀','😎','🤓','😺','🦊','🐼','🐯','🦁','🐰','🐨','🐸','🐵',
  '🦄','🐲','🐢','🐧','🐤','🦉','🦋','🐝','🐞','🐳','🦈','🐬',
  '👧','👦','👩','👨','🧒','👶','🧓','👵','👴','🙅','🙆','💁',
  '🤖','👽','🎃','🤡','🥷','🧙','🧚','🧛','🧜','🧝','🧞','🧟',
];

// ---- 暴露到 window ----
window.DD = {
  GRADES, VERSIONS, SUBJECTS, ACHIEVEMENTS,
  QUESTIONS, DICT, EVENTS, PRESET_AVATARS,
  makeMapNodes, makeDailyTasks,
};
