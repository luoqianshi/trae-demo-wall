// ============================================================
// 词遇 CIYU · 全局状态与 Mock 数据
// ============================================================

// ------------------------------------------------------------
// 1. 基本单元数据（单词 / 语法 / 表达）
// ------------------------------------------------------------
var units = [
  {
    id: 1,
    word: '食べる',
    kana: 'たべる',
    meaning: '吃',
    type: '动词·一段',
    familiarity: 'medium',
    seenCount: 5,
    meanings: [
      { text: '吃、食用', example: '朝ごはんを食べる。', exampleCn: '吃早饭。' },
      { text: '（药等）服用', example: '薬を食べる。', exampleCn: '吃药。' }
    ],
    associations: ['食う', '召し上がる', '〜てから', '〜前に', 'ご飯', '外食', '食事', '口語'],
    timeline: [
      { date: '07-10', action: '首次学习', type: 'learn' },
      { date: '07-12', action: '复习巩固', type: 'review' },
      { date: '07-14', action: '再次复习', type: 'review' }
    ]
  },
  {
    id: 2,
    word: '勉強',
    kana: 'べんきょう',
    meaning: '学习',
    type: '名词·サ变',
    familiarity: 'high',
    seenCount: 12,
    meanings: [
      { text: '学习、用功', example: '日本語を勉強しています。', exampleCn: '正在学习日语。' }
    ],
    associations: ['勉強する', '授業', '宿題', 'テスト'],
    timeline: [
      { date: '07-05', action: '首次学习', type: 'learn' },
      { date: '07-08', action: '复习巩固', type: 'review' },
      { date: '07-11', action: '测试答对', type: 'test' }
    ]
  },
  {
    id: 3,
    word: '天気',
    kana: 'てんき',
    meaning: '天气',
    type: '名词',
    familiarity: 'high',
    seenCount: 18,
    meanings: [
      { text: '天气', example: '今日は天気がいい。', exampleCn: '今天天气很好。' }
    ],
    associations: ['晴れ', '雨', '暑い', '寒い'],
    timeline: [
      { date: '07-01', action: '首次学习', type: 'learn' },
      { date: '07-03', action: '听力练习', type: 'practice' },
      { date: '07-07', action: '口语练习', type: 'practice' }
    ]
  },
  {
    id: 4,
    word: '散歩',
    kana: 'さんぽ',
    meaning: '散步',
    type: '名词·サ变',
    familiarity: 'low',
    seenCount: 2,
    meanings: [
      { text: '散步、漫步', example: '散歩に行きましょう。', exampleCn: '去散步吧。' }
    ],
    associations: ['歩く', '公園', '散歩道'],
    timeline: [
      { date: '07-13', action: '首次学习', type: 'learn' },
      { date: '07-14', action: '场景练习', type: 'practice' }
    ]
  },
  {
    id: 5,
    word: '公園',
    kana: 'こうえん',
    meaning: '公园',
    type: '名词',
    familiarity: 'medium',
    seenCount: 6,
    meanings: [
      { text: '公园', example: '公園で遊ぶ。', exampleCn: '在公园里玩。' }
    ],
    associations: ['庭', '広場', '散歩'],
    timeline: [
      { date: '07-06', action: '首次学习', type: 'learn' },
      { date: '07-09', action: '阅读练习', type: 'practice' }
    ]
  },
  {
    id: 6,
    word: 'お弁当',
    kana: 'おべんとう',
    meaning: '便当、盒饭',
    type: '名词',
    familiarity: 'low',
    seenCount: 1,
    meanings: [
      { text: '便当、盒饭', example: 'お弁当を作る。', exampleCn: '做便当。' }
    ],
    associations: ['おにぎり', '昼食', '食事'],
    timeline: [
      { date: '07-14', action: '首次学习', type: 'learn' }
    ]
  }
];

// ------------------------------------------------------------
// 2. 划词查询映射表（长词优先匹配）
// ------------------------------------------------------------
var wordLookup = {};
units.forEach(function(u) { wordLookup[u.word] = u; });

// 补充常用词（不在 units 主列表中但会出现在句子里）
var extraVocab = {
  'いい':     { word: 'いい',     kana: 'いい',     meaning: '好的',         type: '形容词' },
  '今日':     { word: '今日',     kana: 'きょう',   meaning: '今天',         type: '名词' },
  'そう':     { word: 'そう',     kana: 'そう',     meaning: '那样、那么',   type: '副词' },
  'しましょう':{ word: 'しましょう',kana: 'しましょう',meaning: '…吧（提议）', type: '助动词·意志形' },
  'ですね':   { word: 'ですね',   kana: 'ですね',   meaning: '是…呢',       type: '助动词+终助词' },
  '食う':     { word: '食う',     kana: 'くう',     meaning: '吃（口语）',   type: '动词·五段' },
  '召し上がる':{ word: '召し上がる',kana: 'めしあがる',meaning: '吃（尊敬语）',type: '动词·一段' },
  'ご飯':     { word: 'ご飯',     kana: 'ごはん',   meaning: '米饭、饭',     type: '名词' },
  '食事':     { word: '食事',     kana: 'しょくじ', meaning: '饮食、吃饭',   type: '名词·サ变' },
  // 京都旅行短文新增词汇
  '友達':     { word: '友達',     kana: 'ともだち', meaning: '朋友',         type: '名词' },
  '一緒に':   { word: '一緒に',   kana: 'いっしょに',meaning: '一起',        type: '副词' },
  '京都':     { word: '京都',     kana: 'きょうと', meaning: '京都',         type: '名词' },
  '新幹線':   { word: '新幹線',   kana: 'しんかんせん',meaning: '新干线',    type: '名词' },
  '予定':     { word: '予定',     kana: 'よてい',   meaning: '计划',         type: '名词' },
  '着いた':   { word: '着いた',   kana: 'ついた',   meaning: '到达了',       type: '动词·五段' },
  '晴れ':     { word: '晴れ',     kana: 'はれ',     meaning: '晴天',         type: '名词' },
  'よかった': { word: 'よかった', kana: 'よかった', meaning: '太好了',       type: '形容词' },
  'まず':     { word: 'まず',     kana: 'まず',     meaning: '首先',         type: '副词' },
  '金閣寺':   { word: '金閣寺',   kana: 'きんかくじ',meaning: '金阁寺',      type: '名词' },
  'きれい':   { word: 'きれい',   kana: 'きれい',   meaning: '美丽',         type: 'ナ形容詞' },
  '庭園':     { word: '庭園',     kana: 'ていえん', meaning: '庭园',         type: '名词' },
  '池':       { word: '池',       kana: 'いけ',     meaning: '池塘',         type: '名词' },
  '前':       { word: '前',       kana: 'まえ',     meaning: '前面',         type: '名词' },
  '撮りました':{ word: '撮りました',kana: 'とりました',meaning: '拍了',      type: '动词·五段' },
  '出て':     { word: '出て',     kana: 'でて',     meaning: '出了',         type: '动词·一段' },
  '入りました':{ word: '入りました',kana: 'はいりました',meaning:'进入了',   type: '动词·五段' },
  'お昼':     { word: 'お昼',     kana: 'おひる',   meaning: '中午',         type: '名词' },
  '店員':     { word: '店員',     kana: 'てんいん', meaning: '店员',         type: '名词' },
  '聞きました':{ word: '聞きました',kana: 'ききました',meaning:'问了',      type: '动词·五段' },
  'とても':   { word: 'とても',   kana: 'とても',   meaning: '非常',         type: '副词' },
  '午後':     { word: '午後',     kana: 'ごご',     meaning: '下午',         type: '名词' },
  '伏見稲荷': { word: '伏見稲荷', kana: 'ふしみいなり',meaning:'伏见稻荷',   type: '名词' },
  '赤い':     { word: '赤い',     kana: 'あかい',   meaning: '红色的',       type: 'イ形容詞' },
  '鳥居':     { word: '鳥居',     kana: 'とりい',   meaning: '鸟居',         type: '名词' },
  '千':       { word: '千',       kana: 'せん',     meaning: '千',           type: '数词' },
  'あって':   { word: 'あって',   kana: 'あって',   meaning: '有',           type: '动词·五段' },
  '神秘的':   { word: '神秘的',   kana: 'しんぴてき',meaning: '神秘的',      type: 'ナ形容詞' },
  'お参り':   { word: 'お参り',   kana: 'おまいり', meaning: '参拜',         type: '名词' },
  'お守り':   { word: 'お守り',   kana: 'おまもり', meaning: '护身符',       type: '名词' },
  '買いました':{ word: '買いました',kana: 'かいました',meaning:'买了',      type: '动词·五段' },
  '夜':       { word: '夜',       kana: 'よる',     meaning: '晚上',         type: '名词' },
  '祇園':     { word: '祇園',     kana: 'ぎおん',   meaning: '祇园',         type: '名词' },
  '白い':     { word: '白い',     kana: 'しろい',   meaning: '白色的',       type: 'イ形容詞' },
  '顔':       { word: '顔',       kana: 'かお',     meaning: '脸',           type: '名词' },
  '芸者':     { word: '芸者',     kana: 'げいしゃ', meaning: '艺伎',         type: '名词' },
  '見かけました':{ word: '見かけました',kana: 'みかけました',meaning:'偶然看到',type: '动词·一段' },
  'そして':   { word: 'そして',   kana: 'そして',   meaning: '然后',         type: '接续词' },
  '旅館':     { word: '旅館',     kana: 'りょかん', meaning: '旅馆',         type: '名词' },
  '帰って':   { word: '帰って',   kana: 'かえって', meaning: '回去',         type: '动词·五段' },
  'ゆっくり': { word: 'ゆっくり', kana: 'ゆっくり', meaning: '慢慢地',       type: '副词' },
  '休みます': { word: '休みます', kana: 'やすみます',meaning: '休息',       type: '动词·五段' }
};
Object.keys(extraVocab).forEach(function(k) {
  if (!wordLookup[k]) wordLookup[k] = extraVocab[k];
});

// ------------------------------------------------------------
// 3. 测试题库
// ------------------------------------------------------------
var testQuestions = [
  {
    type: '看词选义',
    question: '「食べる」的意思是？',
    options: ['喝', '吃', '看', '走'],
    answer: 1,
    explanation: '「食べる」（たべる）意为"吃"，是一段动词。'
  },
  {
    type: '看词选义',
    question: '「天気」的意思是？',
    options: ['天气', '天空', '电气', '气候'],
    answer: 0,
    explanation: '「天気」（てんき）意为"天气"。'
  },
  {
    type: '看义选词',
    question: '"散步"的日语是？',
    options: ['勉強', '散歩', '公園', '天気'],
    answer: 1,
    explanation: '「散歩」（さんぽ）意为"散步"。'
  },
  {
    type: '看词选义',
    question: '「お弁当」的意思是？',
    options: ['零食', '便当', '晚餐', '饮料'],
    answer: 1,
    explanation: '「お弁当」（おべんとう）意为"便当、盒饭"。'
  },
  {
    type: '语法题',
    question: '「〜しましょう」表示什么语气？',
    options: ['命令', '提议/邀请', '否定', '过去'],
    answer: 1,
    explanation: '「〜しましょう」是动词意志形，表示提议或邀请，相当于"…吧"。'
  }
];

// ------------------------------------------------------------
// 4. 学习历史记录
// ------------------------------------------------------------
var historyEntries = [
  { date: '2小时前', action: '学习了「お弁当」', type: 'learn' },
  { date: '今天',   action: '完成了场景练习「购物」', type: 'practice' },
  { date: '今天',   action: '阅读了京都旅行短文', type: 'practice' },
  { date: '昨天',   action: '测试得分 4/5', type: 'test' },
  { date: '昨天',   action: '复习了「散歩」「食べる」', type: 'review' },
  { date: '2天前',  action: '学习了「散歩」', type: 'learn' },
  { date: '3天前',  action: '解锁了「阅读理解」模块', type: 'unlock' },
  { date: '4天前',  action: '学习了「公園」', type: 'learn' },
  { date: '5天前',  action: '复习了「天気」「勉強」', type: 'review' },
  { date: '6天前',  action: '完成了听力练习', type: 'practice' }
];

// ------------------------------------------------------------
// 5. 阅读短文（内联解析用）—— 京都旅行记
//    根据用户目标（旅游）推荐，标注重点词汇与注音
// ------------------------------------------------------------
var readingSentences = [
  {
    words: [
      { word: '来週', kana: 'らいしゅう', meaning: '下周', familiarity: 'low', showRuby: true, grammarNote: '时间名词，旅游计划常用' },
      { word: '友達', kana: 'ともだち', meaning: '朋友', familiarity: 'medium', showRuby: false },
      { word: 'と', kana: 'と', meaning: '和…一起', familiarity: 'high', showRuby: false, grammarNote: '格助词，表示共同动作的伙伴' },
      { word: '一緒に', kana: 'いっしょに', meaning: '一起', familiarity: 'low', showRuby: false, grammarNote: '副词，强调共同进行某事' },
      { word: '京都', kana: 'きょうと', meaning: '京都', familiarity: 'low', showRuby: true, grammarNote: '日本著名旅游城市，古都' },
      { word: 'へ', kana: 'へ', meaning: '（方向助词）', familiarity: 'high', showRuby: false, grammarNote: '表示移动的方向，读作\"e\"' },
      { word: '旅行', kana: 'りょこう', meaning: '旅行', familiarity: 'low', showRuby: false, grammarNote: '名词·サ变，旅游场景核心词' },
      { word: 'に', kana: 'に', meaning: '（目的助词）', familiarity: 'high', showRuby: false, grammarNote: '「へ…に行く」表示去某地做某事' },
      { word: '行きます', kana: 'いきます', meaning: '去', familiarity: 'medium', showRuby: false, grammarNote: '行く的礼貌体（ます形）' }
    ]
  },
  {
    words: [
      { word: '新幹線', kana: 'しんかんせん', meaning: '新干线', familiarity: 'low', showRuby: true, grammarNote: '日本高速铁路，旅游交通常用' },
      { word: 'で', kana: 'で', meaning: '（交通工具）', familiarity: 'high', showRuby: false, grammarNote: '格助词\"で\"表示交通手段' },
      { word: '行く', kana: 'いく', meaning: '去', familiarity: 'high', showRuby: false, grammarNote: '行く的原形' },
      { word: '予定', kana: 'よてい', meaning: '计划', familiarity: 'low', showRuby: false, grammarNote: '名词，旅游安排常用' },
      { word: 'です', kana: 'です', meaning: '是', familiarity: 'high', showRuby: false }
    ]
  },
  {
    words: [
      { word: '京都', kana: 'きょうと', meaning: '京都', familiarity: 'low', showRuby: true },
      { word: 'に', kana: 'に', meaning: '（到达点）', familiarity: 'high', showRuby: false, grammarNote: '表示存在的场所或到达点' },
      { word: '着いた', kana: 'ついた', meaning: '到达了', familiarity: 'low', showRuby: false, grammarNote: '着く的过去式：到达' },
      { word: 'ら', kana: 'ら', meaning: '（假设）', familiarity: 'high', showRuby: false, grammarNote: '〜たら：如果…之后' },
      { word: '天気', kana: 'てんき', meaning: '天气', familiarity: 'high', showRuby: false },
      { word: 'が', kana: 'が', meaning: '（主格）', familiarity: 'high', showRuby: false, grammarNote: '主格助词' },
      { word: '晴れ', kana: 'はれ', meaning: '晴天', familiarity: 'low', showRuby: false, grammarNote: '名词，天气预报常用' },
      { word: 'て', kana: 'て', meaning: '（接续）', familiarity: 'high', showRuby: false, grammarNote: '〜て：中顿，连接前后句' },
      { word: 'よかった', kana: 'よかった', meaning: '太好了', familiarity: 'medium', showRuby: false, grammarNote: 'いい的过去式：幸好…' }
    ]
  },
  {
    words: [
      { word: 'まず', kana: 'まず', meaning: '首先', familiarity: 'low', showRuby: true, grammarNote: '副词，用于列举第一步' },
      { word: '金閣寺', kana: 'きんかくじ', meaning: '金阁寺', familiarity: 'low', showRuby: false, grammarNote: '京都著名景点，世界文化遗产' },
      { word: 'へ', kana: 'へ', meaning: '（方向）', familiarity: 'high', showRuby: false },
      { word: '行って', kana: 'いって', meaning: '去了（然后）', familiarity: 'medium', showRuby: true, grammarNote: '行く的て形：先后动作' },
      { word: 'きれい', kana: 'きれい', meaning: '美丽、漂亮', familiarity: 'low', showRuby: false, grammarNote: '形容动词，ナ形容詞' },
      { word: 'な', kana: 'な', meaning: '（形容动词）', familiarity: 'high', showRuby: false, grammarNote: 'ナ形容词连体形' },
      { word: '庭園', kana: 'ていえん', meaning: '庭园', familiarity: 'low', showRuby: false, grammarNote: '名词，日本寺庙多附庭园' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '見ました', kana: 'みました', meaning: '看了', familiarity: 'medium', showRuby: false, grammarNote: '見る的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: '池', kana: 'いけ', meaning: '池塘', familiarity: 'low', showRuby: true, grammarNote: '名词，金阁寺前有镜湖池' },
      { word: 'の', kana: 'の', meaning: '（所属）', familiarity: 'high', showRuby: false },
      { word: '前', kana: 'まえ', meaning: '前面', familiarity: 'high', showRuby: false, grammarNote: '名词' },
      { word: 'で', kana: 'で', meaning: '在…', familiarity: 'high', showRuby: false, grammarNote: '场所助词' },
      { word: '写真', kana: 'しゃしん', meaning: '照片', familiarity: 'medium', showRuby: false },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '撮りました', kana: 'とりました', meaning: '拍了', familiarity: 'low', showRuby: false, grammarNote: '撮る的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: 'お寺', kana: 'おてら', meaning: '寺庙', familiarity: 'low', showRuby: true, grammarNote: 'お表示礼貌，寺读てら' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '出て', kana: 'でて', meaning: '出了（然后）', familiarity: 'medium', showRuby: false, grammarNote: '出る的て形：离开' },
      { word: 'から', kana: 'から', meaning: '（之后）', familiarity: 'medium', showRuby: false, grammarNote: '〜てから：做完…之后' },
      { word: '近く', kana: 'ちかく', meaning: '附近', familiarity: 'low', showRuby: false },
      { word: 'の', kana: 'の', meaning: '（所属）', familiarity: 'high', showRuby: false },
      { word: 'レストラン', kana: 'れすとらん', meaning: '餐厅', familiarity: 'low', showRuby: false, grammarNote: '外来语 restaurant' },
      { word: 'に', kana: 'に', meaning: '（目的地）', familiarity: 'high', showRuby: false, grammarNote: '表示进入的场所' },
      { word: '入りました', kana: 'はいりました', meaning: '进入了', familiarity: 'low', showRuby: false, grammarNote: '入る的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: 'お昼', kana: 'おひる', meaning: '中午', familiarity: 'low', showRuby: true, grammarNote: 'お表示礼貌，昼=中午' },
      { word: 'ご飯', kana: 'ごはん', meaning: '饭', familiarity: 'medium', showRuby: false, grammarNote: 'ご是礼貌前缀，饭的意思' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '食べましょう', kana: 'たべましょう', meaning: '吃吧（提议）', familiarity: 'medium', showRuby: false, grammarNote: '食べる的意志形：礼貌提议' }
    ]
  },
  {
    words: [
      { word: '店員', kana: 'てんいん', meaning: '店员', familiarity: 'low', showRuby: true, grammarNote: '名词，餐厅服务人员' },
      { word: 'さん', kana: 'さん', meaning: '（敬称）', familiarity: 'high', showRuby: false, grammarNote: '接在人名或职业后的敬称' },
      { word: 'に', kana: 'に', meaning: '（对象）', familiarity: 'high', showRuby: false, grammarNote: '表示动作的对象' },
      { word: 'おすすめ', kana: 'おすすめ', meaning: '推荐', familiarity: 'low', showRuby: false, grammarNote: '名词，餐厅点餐时非常常用' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '聞きました', kana: 'ききました', meaning: '问了', familiarity: 'low', showRuby: false, grammarNote: '聞く的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: 'この', kana: 'この', meaning: '这个', familiarity: 'medium', showRuby: true, grammarNote: '指示词，连体修饰' },
      { word: 'お店', kana: 'おみせ', meaning: '这家店', familiarity: 'low', showRuby: false, grammarNote: 'お表示礼貌，店读みせ' },
      { word: 'の', kana: 'の', meaning: '（所属）', familiarity: 'high', showRuby: false },
      { word: 'お弁当', kana: 'おべんとう', meaning: '便当', familiarity: 'low', showRuby: false, grammarNote: '日本特色盒饭，旅游常买' },
      { word: 'が', kana: 'が', meaning: '（主格）', familiarity: 'high', showRuby: false },
      { word: 'とても', kana: 'とても', meaning: '非常', familiarity: 'medium', showRuby: false, grammarNote: '副词，表示程度很高' },
      { word: '人気', kana: 'にんき', meaning: '人气、受欢迎', familiarity: 'low', showRuby: false, grammarNote: '名词，常作サ变动词使用' },
      { word: 'です', kana: 'です', meaning: '是', familiarity: 'high', showRuby: false }
    ]
  },
  {
    words: [
      { word: 'じゃあ', kana: 'じゃあ', meaning: '那（么）', familiarity: 'medium', showRuby: false, grammarNote: '口语接续词，表示决定' },
      { word: 'お弁当', kana: 'おべんとう', meaning: '便当', familiarity: 'low', showRuby: true },
      { word: 'に', kana: 'に', meaning: '（决定）', familiarity: 'high', showRuby: false, grammarNote: '表示选择/决定的对象' },
      { word: 'しましょう', kana: 'しましょう', meaning: '…吧（决定）', familiarity: 'medium', showRuby: false, grammarNote: 'する的意志形：做出决定' }
    ]
  },
  {
    words: [
      { word: '午後', kana: 'ごご', meaning: '下午', familiarity: 'low', showRuby: true, grammarNote: '时间名词' },
      { word: 'は', kana: 'は', meaning: '（提示）', familiarity: 'high', showRuby: false, grammarNote: '提示助词，读作\"wa\"' },
      { word: '伏見稲荷', kana: 'ふしみいなり', meaning: '伏见稻荷', familiarity: 'low', showRuby: false, grammarNote: '京都著名神社，千本鸟居' },
      { word: '神社', kana: 'じんじゃ', meaning: '神社', familiarity: 'low', showRuby: false, grammarNote: '日本传统宗教建筑' },
      { word: 'へ', kana: 'へ', meaning: '（方向）', familiarity: 'high', showRuby: false },
      { word: '行きます', kana: 'いきます', meaning: '去', familiarity: 'medium', showRuby: false }
    ]
  },
  {
    words: [
      { word: '赤い', kana: 'あかい', meaning: '红色的', familiarity: 'low', showRuby: true, grammarNote: 'イ形容词，赤+い' },
      { word: '鳥居', kana: 'とりい', meaning: '鸟居', familiarity: 'low', showRuby: false, grammarNote: '神社入口的标志性建筑' },
      { word: 'が', kana: 'が', meaning: '（主格）', familiarity: 'high', showRuby: false },
      { word: '千', kana: 'せん', meaning: '千', familiarity: 'medium', showRuby: false, grammarNote: '数词，表示数量多' },
      { word: '本', kana: 'ぼん', meaning: '根、条', familiarity: 'low', showRuby: false, grammarNote: '量词，细长长东西的数法' },
      { word: 'も', kana: 'も', meaning: '（也/甚至）', familiarity: 'high', showRuby: false, grammarNote: '表示数量多，惊讶语气' },
      { word: 'あって', kana: 'あって', meaning: '有（而且）', familiarity: 'medium', showRuby: false, grammarNote: 'ある的て形：存在+中顿' },
      { word: 'とても', kana: 'とても', meaning: '非常', familiarity: 'medium', showRuby: false, grammarNote: '副词' },
      { word: '神秘的', kana: 'しんぴてき', meaning: '神秘的', familiarity: 'low', showRuby: false, grammarNote: 'ナ形容詞' },
      { word: 'です', kana: 'です', meaning: '是', familiarity: 'high', showRuby: false }
    ]
  },
  {
    words: [
      { word: '神社', kana: 'じんじゃ', meaning: '神社', familiarity: 'low', showRuby: true },
      { word: 'で', kana: 'で', meaning: '在…', familiarity: 'high', showRuby: false, grammarNote: '场所助词' },
      { word: 'お参り', kana: 'おまいり', meaning: '参拜', familiarity: 'low', showRuby: false, grammarNote: '名词，神社参拜的礼貌说法' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: 'して', kana: 'して', meaning: '做了（然后）', familiarity: 'high', showRuby: false, grammarNote: 'する的て形' },
      { word: 'から', kana: 'から', meaning: '（之后）', familiarity: 'medium', showRuby: false, grammarNote: '〜てから' },
      { word: 'お守り', kana: 'おまもり', meaning: '护身符', familiarity: 'low', showRuby: false, grammarNote: '名词，神社购买的护身符' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '買いました', kana: 'かいました', meaning: '买了', familiarity: 'low', showRuby: false, grammarNote: '買う的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: '夜', kana: 'よる', meaning: '晚上', familiarity: 'medium', showRuby: false, grammarNote: '时间名词' },
      { word: 'は', kana: 'は', meaning: '（提示）', familiarity: 'high', showRuby: false },
      { word: '祇園', kana: 'ぎおん', meaning: '祇园', familiarity: 'low', showRuby: true, grammarNote: '京都著名街区，艺伎文化' },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '散歩', kana: 'さんぽ', meaning: '散步', familiarity: 'low', showRuby: false, grammarNote: '名词·サ变，漫步游览' },
      { word: 'しましょう', kana: 'しましょう', meaning: '…吧', familiarity: 'medium', showRuby: false, grammarNote: 'する的意志形：提议' }
    ]
  },
  {
    words: [
      { word: '白い', kana: 'しろい', meaning: '白色的', familiarity: 'low', showRuby: true, grammarNote: 'イ形容词' },
      { word: '顔', kana: 'かお', meaning: '脸', familiarity: 'low', showRuby: false, grammarNote: '名词' },
      { word: 'の', kana: 'の', meaning: '（所属）', familiarity: 'high', showRuby: false },
      { word: '芸者', kana: 'げいしゃ', meaning: '艺伎', familiarity: 'low', showRuby: false, grammarNote: '名词，日本传统表演艺术者' },
      { word: 'さん', kana: 'さん', meaning: '（敬称）', familiarity: 'high', showRuby: false },
      { word: 'を', kana: 'を', meaning: '（宾格）', familiarity: 'high', showRuby: false },
      { word: '見かけました', kana: 'みかけました', meaning: '偶然看到', familiarity: 'low', showRuby: false, grammarNote: '見かける的礼貌体过去式' }
    ]
  },
  {
    words: [
      { word: 'そして', kana: 'そして', meaning: '然后', familiarity: 'high', showRuby: false, grammarNote: '接续词，连接句子' },
      { word: '旅館', kana: 'りょかん', meaning: '旅馆', familiarity: 'low', showRuby: true, grammarNote: '名词，日本传统住宿' },
      { word: 'に', kana: 'に', meaning: '（目的地）', familiarity: 'high', showRuby: false },
      { word: '帰って', kana: 'かえって', meaning: '回去（然后）', familiarity: 'low', showRuby: false, grammarNote: '帰る的て形：返回' },
      { word: 'ゆっくり', kana: 'ゆっくり', meaning: '慢慢地、悠闲地', familiarity: 'low', showRuby: false, grammarNote: '副词，表示放松的状态' },
      { word: '休みます', kana: 'やすみます', meaning: '休息', familiarity: 'low', showRuby: false, grammarNote: '休む的礼貌体' }
    ]
  }
];

// ------------------------------------------------------------
// 5.5 阅读改写数据
// ------------------------------------------------------------
var readingRewrites = {
  dialog: {
    title: '对话体改写',
    desc: '把独白改成朋友间的对话',
    sentences: [
      { words: [
        { word: 'A', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'ねえ', kana: 'ねえ', meaning: '喂', familiarity: 'high', showRuby: false, grammarNote: '口语招呼' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '来週', kana: 'らいしゅう', meaning: '下周', familiarity: 'low', showRuby: true, grammarNote: '时间名词' },
        { word: '京都', kana: 'きょうと', meaning: '京都', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '行かない', kana: 'いかない', meaning: '不去吗', familiarity: 'medium', showRuby: true, grammarNote: '行く的否定' },
        { word: '？', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '新幹線', kana: 'しんかんせん', meaning: '新干线', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '用', familiarity: 'high', showRuby: false, grammarNote: '交通手段' },
        { word: '一緒に', kana: 'いっしょに', meaning: '一起', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: '行こう', kana: 'いこう', meaning: '去吧', familiarity: 'medium', showRuby: true, grammarNote: '行く的意志形' },
        { word: 'よ', kana: 'よ', meaning: '（劝诱）', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'B', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'えっ', kana: 'えっ', meaning: '诶', familiarity: 'high', showRuby: false, grammarNote: '惊讶' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '本当', kana: 'ほんとう', meaning: '真的', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: '？', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'いい', kana: 'いい', meaning: '好', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'ね', kana: 'ね', meaning: '呢', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '！', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'どこ', kana: 'どこ', meaning: '哪里', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '行きたい', kana: 'いきたい', meaning: '想去', familiarity: 'medium', showRuby: true, grammarNote: '行く的たい形' },
        { word: '？', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'A', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'まず', kana: 'まず', meaning: '首先', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '金閣寺', kana: 'きんかくじ', meaning: '金阁寺', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'あと', kana: 'あと', meaning: '然后', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '伏見稲荷', kana: 'ふしみいなり', meaning: '伏见稻荷', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: '神社', kana: 'じんじゃ', meaning: '神社', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'も', kana: 'も', meaning: '也', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'いい', kana: 'いい', meaning: '好', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'と', kana: 'と', meaning: '觉得', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '思う', kana: 'おもう', meaning: '想', familiarity: 'high', showRuby: true, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'B', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'お昼', kana: 'おひる', meaning: '中午', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'ご飯', kana: 'ごはん', meaning: '饭', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'どう', kana: 'どう', meaning: '怎么', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'する', kana: 'する', meaning: '做', familiarity: 'high', showRuby: true, grammarNote: '' },
        { word: '？', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'A', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'お弁当', kana: 'おべんとう', meaning: '便当', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '買って', kana: 'かって', meaning: '买了（然后）', familiarity: 'low', showRuby: true, grammarNote: '買う的て形' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '公園', kana: 'こうえん', meaning: '公园', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '在', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '食べよう', kana: 'たべよう', meaning: '吃吧', familiarity: 'medium', showRuby: true, grammarNote: '食べる的意志形' },
        { word: 'よ', kana: 'よ', meaning: '（提议）', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'B', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'それ', kana: 'それ', meaning: '那', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'いい', kana: 'いい', meaning: '好', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'ね', kana: 'ね', meaning: '呢', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '！', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '夜', kana: 'よる', meaning: '晚上', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '祇園', kana: 'ぎおん', meaning: '祇园', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '散歩', kana: 'さんぽ', meaning: '散步', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'しよう', kana: 'しよう', meaning: '做吧', familiarity: 'medium', showRuby: true, grammarNote: 'する的意志形' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'A', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'うん', kana: 'うん', meaning: '嗯', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'それから', kana: 'それから', meaning: '然后', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '旅館', kana: 'りょかん', meaning: '旅馆', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'に', kana: 'に', meaning: '到', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '帰って', kana: 'かえって', meaning: '回去', familiarity: 'low', showRuby: true, grammarNote: '帰る的て形' },
        { word: 'ゆっくり', kana: 'ゆっくり', meaning: '悠闲地', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: '休もう', kana: 'やすもう', meaning: '休息吧', familiarity: 'low', showRuby: true, grammarNote: '休む的意志形' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: 'B', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '「', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '楽しみ', kana: 'たのしみ', meaning: '期待', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '！', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '早く', kana: 'はやく', meaning: '快点', familiarity: 'medium', showRuby: true, grammarNote: '早い的く形' },
        { word: '来週', kana: 'らいしゅう', meaning: '下周', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '来い', kana: 'こい', meaning: '来吧', familiarity: 'high', showRuby: true, grammarNote: '来る的命令形' },
        { word: '！', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '」', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]}
    ]
  },
  diary: {
    title: '日记体改写',
    desc: '以日记的形式记录这一天',
    sentences: [
      { words: [
        { word: '今日', kana: 'きょう', meaning: '今天', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '友達', kana: 'ともだち', meaning: '朋友', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'と', kana: 'と', meaning: '和', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '京都', kana: 'きょうと', meaning: '京都', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'へ', kana: 'へ', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '旅行', kana: 'りょこう', meaning: '旅行', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'に', kana: 'に', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '行った。', kana: 'いった。', meaning: '去了。', familiarity: 'medium', showRuby: true, grammarNote: '行く的过去式' }
      ]},
      { words: [
        { word: '新幹線', kana: 'しんかんせん', meaning: '新干线', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '二時間', kana: 'にじかん', meaning: '两小时', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'ぐらい', kana: 'ぐらい', meaning: '左右', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '着いた。', kana: 'ついた。', meaning: '到了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '天気', kana: 'てんき', meaning: '天气', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '晴れて', kana: 'はれて', meaning: '晴了', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'よかった。', kana: 'よかった。', meaning: '太好了。', familiarity: 'medium', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: 'まず', kana: 'まず', meaning: '首先', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '金閣寺', kana: 'きんかくじ', meaning: '金阁寺', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'へ', kana: 'へ', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '行って', kana: 'いって', meaning: '去了', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '池', kana: 'いけ', meaning: '池塘', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '前', kana: 'まえ', meaning: '前面', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '写真', kana: 'しゃしん', meaning: '照片', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'を', kana: 'を', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'たくさん', kana: 'たくさん', meaning: '很多', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '撮った。', kana: 'とった。', meaning: '拍了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: 'お昼', kana: 'おひる', meaning: '中午', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '近く', kana: 'ちかく', meaning: '附近', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'レストラン', kana: 'れすとらん', meaning: '餐厅', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'お弁当', kana: 'おべんとう', meaning: '便当', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'を', kana: 'を', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '食べた。', kana: 'たべた。', meaning: '吃了。', familiarity: 'medium', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: 'お弁当', kana: 'おべんとう', meaning: '便当', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'とても', kana: 'とても', meaning: '非常', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '美味しくて', kana: 'おいしくて', meaning: '好吃', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'びっくり', kana: 'びっくり', meaning: '惊讶', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'した。', kana: 'した。', meaning: '了。', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: '午後', kana: 'ごご', meaning: '下午', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '伏見稲荷', kana: 'ふしみいなり', meaning: '伏见稻荷', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: '神社', kana: 'じんじゃ', meaning: '神社', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'へ', kana: 'へ', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '行った。', kana: 'いった。', meaning: '去了。', familiarity: 'medium', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '千本', kana: 'せんぼん', meaning: '千本', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '鳥居', kana: 'とりい', meaning: '鸟居', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'とても', kana: 'とても', meaning: '非常', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '神秘的', kana: 'しんぴてき', meaning: '神秘的', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '感動', kana: 'かんどう', meaning: '感动', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'した。', kana: 'した。', meaning: '了。', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: '夜', kana: 'よる', meaning: '晚上', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '祇園', kana: 'ぎおん', meaning: '祇园', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'を', kana: 'を', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '散歩', kana: 'さんぽ', meaning: '散步', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'して', kana: 'して', meaning: '做了', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '旅館', kana: 'りょかん', meaning: '旅馆', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'に', kana: 'に', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '帰った。', kana: 'かえった。', meaning: '回去了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '京都', kana: 'きょうと', meaning: '京都', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '本当に', kana: 'ほんとうに', meaning: '真的', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '素敵', kana: 'すてき', meaning: '美好', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'な', kana: 'な', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '街', kana: 'まち', meaning: '城市', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'だ', kana: 'だ', meaning: '是', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'と', kana: 'と', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '思った。', kana: 'おもった。', meaning: '想了。', familiarity: 'medium', showRuby: true, grammarNote: '' }
      ]}
    ]
  },
  continue_story: {
    title: '续写',
    desc: 'AI 继续往下写',
    sentences: [
      { words: [
        { word: '翌日', kana: 'よくじつ', meaning: '第二天', familiarity: 'low', showRuby: true, grammarNote: '时间名词，书面语' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '朝', kana: 'あさ', meaning: '早上', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '私', kana: 'わたし', meaning: '我', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'たち', kana: 'たち', meaning: '们', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '早起き', kana: 'はやおき', meaning: '早起', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'して', kana: 'して', meaning: '做了', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '嵐山', kana: 'あらしやま', meaning: '岚山', familiarity: 'low', showRuby: true, grammarNote: '京都著名景区' },
        { word: 'へ', kana: 'へ', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '向かった。', kana: 'むかった。', meaning: '前往了。', familiarity: 'low', showRuby: true, grammarNote: '向かう的过去式' }
      ]},
      { words: [
        { word: '渡月橋', kana: 'とげつきょう', meaning: '渡月桥', familiarity: 'low', showRuby: true, grammarNote: '岚山著名桥梁' },
        { word: 'から', kana: 'から', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '見る', kana: 'みる', meaning: '看', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '景色', kana: 'けしき', meaning: '景色', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '本当に', kana: 'ほんとうに', meaning: '真的', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '素晴らしかった。', kana: 'すばらしかった。', meaning: '太棒了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '竹林', kana: 'ちくりん', meaning: '竹林', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '中', kana: 'なか', meaning: '里面', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'を', kana: 'を', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '歩いている', kana: 'あるいている', meaning: '走着', familiarity: 'medium', showRuby: true, grammarNote: '歩く的て形+いる' },
        { word: 'と', kana: 'と', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'とても', kana: 'とても', meaning: '非常', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: '静か', kana: 'しずか', meaning: '安静', familiarity: 'low', showRuby: true, grammarNote: 'ナ形容詞' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '心', kana: 'こころ', meaning: '心', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '落ち着いた。', kana: 'おちついた。', meaning: '平静了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: 'お昼', kana: 'おひる', meaning: '中午', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '嵐山', kana: 'あらしやま', meaning: '岚山', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '近く', kana: 'ちかく', meaning: '附近', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '豆腐', kana: 'とうふ', meaning: '豆腐', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '料理', kana: 'りょうり', meaning: '料理', familiarity: 'low', showRuby: false, grammarNote: '' },
        { word: 'を', kana: 'を', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '食べた。', kana: 'たべた。', meaning: '吃了。', familiarity: 'medium', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: 'その', kana: 'その', meaning: '那个', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '後', kana: 'あと', meaning: '之后', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '奈良', kana: 'なら', meaning: '奈良', familiarity: 'low', showRuby: true, grammarNote: '古都' },
        { word: 'へ', kana: 'へ', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '移動', kana: 'いどう', meaning: '移动', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'して', kana: 'して', meaning: '做了', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '鹿', kana: 'しか', meaning: '鹿', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'と', kana: 'と', meaning: '和', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '遊んだ。', kana: 'あそんだ。', meaning: '玩了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '東大寺', kana: 'とうだいじ', meaning: '东大寺', familiarity: 'low', showRuby: true, grammarNote: '奈良著名寺庙' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '大仏', kana: 'だいぶつ', meaning: '大佛', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '想像', kana: 'そうぞう', meaning: '想象', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '以上', kana: 'いじょう', meaning: '以上', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'に', kana: 'に', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '大きくて', kana: 'おおきくて', meaning: '大', familiarity: 'high', showRuby: true, grammarNote: '' },
        { word: 'びっくり', kana: 'びっくり', meaning: '惊讶', familiarity: 'medium', showRuby: false, grammarNote: '' },
        { word: 'した。', kana: 'した。', meaning: '了。', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]},
      { words: [
        { word: '夕方', kana: 'ゆうがた', meaning: '傍晚', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '電車', kana: 'でんしゃ', meaning: '电车', familiarity: 'medium', showRuby: true, grammarNote: '' },
        { word: 'で', kana: 'で', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '大阪', kana: 'おおさか', meaning: '大阪', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'に', kana: 'に', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '戻った。', kana: 'もどった。', meaning: '返回了。', familiarity: 'low', showRuby: true, grammarNote: '' }
      ]},
      { words: [
        { word: '二日間', kana: 'ふつかかん', meaning: '两天', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'の', kana: 'の', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '旅', kana: 'たび', meaning: '旅行', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'は', kana: 'は', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'あっという間', kana: 'あっというま', meaning: '一瞬间', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'だった', kana: 'だった', meaning: '是', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '、', kana: '', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: '忘れられない', kana: 'わすれられない', meaning: '难忘', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: '思い出', kana: 'おもいで', meaning: '回忆', familiarity: 'low', showRuby: true, grammarNote: '' },
        { word: 'が', kana: 'が', meaning: '', familiarity: 'high', showRuby: false, grammarNote: '' },
        { word: 'できた。', kana: 'できた。', meaning: '形成了。', familiarity: 'high', showRuby: false, grammarNote: '' }
      ]}
    ]
  }
};

// ------------------------------------------------------------
// 6. 关联网络详情
// ------------------------------------------------------------
var assocDetail = {
  '食う':       { type: '近义表达', desc: '「食べる」的口语/随意说法，多用于男性日常对话。', compare: '食べる（中性）→ 食う（随意、口语）' },
  '召し上がる':  { type: '近义表达', desc: '「食べる」的尊敬语形式，用于对长辈、客人等场合。', compare: '食べる（中性）→ 召し上がる（尊敬）' },
  '〜てから':   { type: '相关语法', desc: '表示动作的先后顺序："做完…之后再…"。',           compare: '食べてから散歩する = 吃完饭后散步' },
  '〜前に':     { type: '相关语法', desc: '表示在某个动作之前。',                              compare: '食事の前に手を洗う = 饭前洗手' },
  'ご飯':       { type: '常用搭配', desc: '米饭、饭。日常用语中也可泛指"吃饭"。',             compare: '' },
  '外食':       { type: '常用搭配', desc: '在外吃饭、下馆子。',                                compare: '' },
  '食事':       { type: '场景差异', desc: '比「ご飯」更正式的表达，多用于书面或正式场合。',   compare: '食事をする（正式）→ ご飯を食べる（日常）' },
  '口語':       { type: '场景差异', desc: '口语中的常见变体，如「食べちゃった」「食っちゃった」。', compare: '食べた（书面/标准）→ 食べちゃった（口语）' }
};

// ------------------------------------------------------------
// 7. 全局响应式状态
// ------------------------------------------------------------
var store = Vue.reactive({
  // ---- 视图路由 ----
  currentView: 'components', // components | home | reading | explore | test | settings | detail | history
  settingsTab: 'goal',
  navStack: [],              // 导航后退栈

  // ---- 当前选中 ----
  selectedUnit: units[0],

  // ---- 划词浮窗 ----
  showPopup: false,
  popupText: '',
  popupUnits: [],
  popupLoading: false,
  popupMatched: false,
  popupResult: '',
  popupResultType: '',

  // ---- AI 对话 ----
  aiChatOpen: false,
  aiMessages: [],
  aiInput: '',

  // ---- 首页嵌入AI回复 ----
  aiEmbedVisible: false,
  aiEmbedHtml: '',

  // ---- 阅读页面 ----
  readingTitle: '',
  readingRewriteKey: '',

  // ---- 推荐标记 ----
  markWalk: 'vague',
  markBento: 'unknown',

  // ---- 测试模块 ----
  testIndex: 0,
  testAnswered: false,
  testChosen: -1,
  testFinished: false,
  testScore: 0,
  testResults: [],
  currentTest: testQuestions[0],

  // ---- 能力评估 ----
  abilityData: [
    { name: '听力', value: 35 },
    { name: '阅读', value: 55 },
    { name: '词汇', value: 45 },
    { name: '语法', value: 30 },
    { name: '表达', value: 20 }
  ],
  abilityStats: { unitCount: 18, mastered: 8, toReview: 5 },

  // ---- 响应式预览 ----
  deviceMode: 'desktop',

  // ---- 单元搜索 ----
  unitSearchQuery: '',

  // ---- 学习目标 ----
  goalText: '想去日本旅游，能看懂菜单和路牌，能简单交流。',
  goalAnalysis: [
    { label: '目标水平', value: 'JLPT N4 左右' },
    { label: '核心词汇', value: '约 800-1000 词（旅游、餐饮、交通）' },
    { label: '重点语法', value: '基本敬语、～てください、～たい、～ましょう' },
    { label: '预估时长', value: '3-6 个月（每天 30 分钟）' },
    { label: '推荐侧重', value: '听力 + 口语，辅以阅读' }
  ]
});
