/**
 * 叮咚学 v2 - 数据文件
 * 包含：年级、版本、学科、成就、称号、等级、题库、词典、课文、活动、头像、地图、每日任务
 * 暴露到 window.DD
 */
(function (window) {
  'use strict';

  // ============== 1. GRADES 年级（19 个：学前班~九年级下册）==============
  var GRADES = [
    { id: 'pre',  name: '学前班', short: '学前', stage: 'pre' },
    { id: 'g1up', name: '一年级上册', short: '一上', stage: 'p' },
    { id: 'g1dn', name: '一年级下册', short: '一下', stage: 'p' },
    { id: 'g2up', name: '二年级上册', short: '二上', stage: 'p' },
    { id: 'g2dn', name: '二年级下册', short: '二下', stage: 'p' },
    { id: 'g3up', name: '三年级上册', short: '三上', stage: 'p' },
    { id: 'g3dn', name: '三年级下册', short: '三下', stage: 'p' },
    { id: 'g4up', name: '四年级上册', short: '四上', stage: 'p' },
    { id: 'g4dn', name: '四年级下册', short: '四下', stage: 'p' },
    { id: 'g5up', name: '五年级上册', short: '五上', stage: 'p' },
    { id: 'g5dn', name: '五年级下册', short: '五下', stage: 'p' },
    { id: 'g6up', name: '六年级上册', short: '六上', stage: 'p' },
    { id: 'g6dn', name: '六年级下册', short: '六下', stage: 'p' },
    { id: 'g7up', name: '七年级上册', short: '七上', stage: 'm' },
    { id: 'g7dn', name: '七年级下册', short: '七下', stage: 'm' },
    { id: 'g8up', name: '八年级上册', short: '八上', stage: 'm' },
    { id: 'g8dn', name: '八年级下册', short: '八下', stage: 'm' },
    { id: 'g9up', name: '九年级上册', short: '九上', stage: 'm' },
    { id: 'g9dn', name: '九年级下册', short: '九下', stage: 'm' }
  ];

  // ============== 2. VERSIONS 教材版本（8 个）==============
  var VERSIONS = [
    { id: 'pep',  name: '人教版',     short: '人教', color: '#e74c3c' },
    { id: 'bsd',  name: '北师大版',   short: '北师', color: '#3498db' },
    { id: 'sjjy', name: '苏教版',     short: '苏教', color: '#16a085' },
    { id: 'jy',   name: '教科版',     short: '教科', color: '#9b59b6' },
    { id: 'sd',   name: '沪教版',     short: '沪教', color: '#e67e22' },
    { id: 'cb',   name: '沪科版',     short: '沪科', color: '#2c3e50' },
    { id: 'wys',  name: '外研版',     short: '外研', color: '#27ae60' },
    { id: 'qdp',  name: '青岛版',     short: '青岛', color: '#f39c12' }
  ];

  // ============== 3. SUBJECTS 学科（8 个）==============
  var SUBJECTS = [
    { id: 'chinese',  name: '语文',   icon: 'book',     gradient: 'linear-gradient(135deg,#ff9a9e,#fad0c4)', sub: ['pep','bsd','sjjy','sd'] },
    { id: 'math',     name: '数学',   icon: 'brain',    gradient: 'linear-gradient(135deg,#a8edea,#fed6e3)', sub: ['pep','bsd','sjjy','jy','sd','cb','qdp'] },
    { id: 'english',  name: '英语',   icon: 'headphones', gradient: 'linear-gradient(135deg,#84fab0,#8fd3f4)', sub: ['pep','wys','sd'] },
    { id: 'science',  name: '科学',   icon: 'rocket',   gradient: 'linear-gradient(135deg,#fccb90,#d57eeb)', sub: ['pep','jy','cb'] },
    { id: 'politics', name: '政治',   icon: 'flag',     gradient: 'linear-gradient(135deg,#f6d365,#fda085)', sub: ['pep'] },
    { id: 'history',  name: '历史',   icon: 'trophy',   gradient: 'linear-gradient(135deg,#e0c3fc,#8ec5fc)', sub: ['pep'] },
    { id: 'music',    name: '音乐',   icon: 'music',    gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', sub: ['pep'] },
    { id: 'art',      name: '美术',   icon: 'palette',  gradient: 'linear-gradient(135deg,#5ee7df,#b490ca)', sub: ['pep'] }
  ];

  // ============== 4. ACHIEVEMENTS 成就（19 个）==============
  var ACHIEVEMENTS = [
    { id: 'first_correct', icon: 'star',   name: '初出茅庐', desc: '答对第一道题', check: function (s) { return s.correctCount >= 1; } },
    { id: 'combo_5',       icon: 'fire',   name: '小试牛刀', desc: '连对 5 题',   check: function (s) { return s.maxCombo >= 5; } },
    { id: 'combo_10',      icon: 'fire',   name: '势如破竹', desc: '连对 10 题',  check: function (s) { return s.maxCombo >= 10; } },
    { id: 'combo_20',      icon: 'fire',   name: '无人能挡', desc: '连对 20 题',  check: function (s) { return s.maxCombo >= 20; } },
    { id: 'streak_3',      icon: 'lightning', name: '持之以恒', desc: '连续登录 3 天', check: function (s) { return s.loginStreak >= 3; } },
    { id: 'streak_7',      icon: 'lightning', name: '一周学霸', desc: '连续登录 7 天', check: function (s) { return s.loginStreak >= 7; } },
    { id: 'streak_30',     icon: 'crown',  name: '月度之星', desc: '连续登录 30 天', check: function (s) { return s.loginStreak >= 30; } },
    { id: 'all_subject',   icon: 'palette', name: '博学多才', desc: '尝试 8 个学科', check: function (s) { return s.subjectCount >= 8; } },
    { id: 'correct_50',    icon: 'check',  name: '熟能生巧', desc: '累计答对 50 题', check: function (s) { return s.correctCount >= 50; } },
    { id: 'correct_100',   icon: 'medal',  name: '百题斩',   desc: '累计答对 100 题', check: function (s) { return s.correctCount >= 100; } },
    { id: 'correct_500',   icon: 'trophy', name: '题海王者', desc: '累计答对 500 题', check: function (s) { return s.correctCount >= 500; } },
    { id: 'review_10',     icon: 'list',   name: '温故知新', desc: '复习 10 道错题', check: function (s) { return s.reviewCount >= 10; } },
    { id: 'map_1',         icon: 'target', name: '初探关卡', desc: '完成第一关',     check: function (s) { return s.mapClear >= 1; } },
    { id: 'app_1',         icon: 'mic',    name: '敢开口说', desc: '完成 1 次语音练习', check: function (s) { return s.speakCount >= 1; } },
    { id: 'post_1',        icon: 'chat',   name: '分享达人', desc: '发布 1 条动态',   check: function (s) { return s.postCount >= 1; } },
    { id: 'rich',          icon: 'coin',   name: '金币满仓', desc: '拥有 1000 金币',   check: function (s) { return s.coin >= 1000; } },
    { id: 'level_10',      icon: 'flag',   name: '崭露头角', desc: '等级达到 10 级',   check: function (s) { return s.level >= 10; } },
    { id: 'level_50',      icon: 'crown',  name: '登峰造极', desc: '等级达到 50 级',   check: function (s) { return s.level >= 50; } },
    { id: 'gift_1',        icon: 'gift',   name: '分享有礼', desc: '邀请 1 位好友',     check: function (s) { return s.inviteCount >= 1; } }
  ];

  // ============== 5. TITLES 称号（11 个）==============
  var TITLES = [
    { id: 'beginner',   icon: 'star',   name: '初学者',  desc: '踏上学习之路',         condition: '完成 10 道题',          check: function (s) { return s.totalCount >= 10; } },
    { id: 'xiaoxue',    icon: 'book',   name: '小学者',  desc: '初窥门径',             condition: '累计答对 50 题',         check: function (s) { return s.correctCount >= 50; } },
    { id: 'zhongxue',   icon: 'brain',  name: '中学者',  desc: '学有所成',             condition: '累计答对 200 题',        check: function (s) { return s.correctCount >= 200; } },
    { id: 'daxue',      icon: 'medal',  name: '大学者',  desc: '博古通今',             condition: '累计答对 500 题',        check: function (s) { return s.correctCount >= 500; } },
    { id: 'xiaoboshi',  icon: 'crown',  name: '小博士',  desc: '知识渊博',             condition: '学习 5 个学科',          check: function (s) { return s.subjectCount >= 5; } },
    { id: 'xiaotiancai', icon: 'lightning', name: '小天才', desc: '天赋异禀',          condition: '最高连对 20 题',         check: function (s) { return s.maxCombo >= 20; } },
    { id: 'xiaozhuangyuan', icon: 'trophy', name: '小状元', desc: '独占鳌头',         condition: '等级达到 30 级',         check: function (s) { return s.level >= 30; } },
    { id: 'jisuan',     icon: 'brain',  name: '计算王',  desc: '数学小能手',           condition: '数学答对 100 题',        check: function (s) { return (s.subjectCorrect && s.subjectCorrect.math || 0) >= 100; } },
    { id: 'beisong',    icon: 'book',   name: '背诵王',  desc: '语文小达人',           condition: '语文答对 100 题',        check: function (s) { return (s.subjectCorrect && s.subjectCorrect.chinese || 0) >= 100; } },
    { id: 'dating',     icon: 'fire',   name: '答题王',  desc: '所向披靡',             condition: '累计答对 1000 题',       check: function (s) { return s.correctCount >= 1000; } },
    { id: 'qiaojiang',  icon: 'palette', name: '巧手工匠', desc: '心灵手巧',           condition: '美术音乐共答对 50 题',   check: function (s) { return ((s.subjectCorrect && s.subjectCorrect.art || 0) + (s.subjectCorrect && s.subjectCorrect.music || 0)) >= 50; } }
  ];

  // ============== 6. LEVELS 等级表（1-99 级）==============
  // 公式：level = floor(sqrt(exp/10)) + 1
  // 即：等级 L 所需经验 = (L-1)^2 * 10
  var LEVELS = [];
  for (var lv = 1; lv <= 99; lv++) {
    LEVELS.push((lv - 1) * (lv - 1) * 10);
  }

  // ============== 7. QUESTIONS 题库（8 学科，每学科 30 题）==============
  // 难度分布：10 简单(easy) + 15 普通(normal) + 5 困难(hard)

  // ----- 语文 30 题 -----
  var Q_CHINESE = [
    { id: 'cn1',  q: '下列哪个字的拼音是"rì"？', opts: ['月','日','山','水'], a: 1, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn2',  q: '"床前明月光"下一句是？', opts: ['疑是地上霜','举头望明月','低头思故乡','夜来风雨声'], a: 0, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn3',  q: '"春"的部首是？', opts: ['日','艹','木','氵'], a: 0, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn4',  q: '"马"字共几画？', opts: ['2 画','3 画','4 画','5 画'], a: 1, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn5',  q: '下列哪组全是象形字？', opts: ['山 水 火','上 下 中','你 我 他','的 了 着'], a: 0, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn6',  q: '"红"的反义词是？', opts: ['绿','蓝','白','黑'], a: 0, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn7',  q: '李白的《静夜思》共几句？', opts: ['2 句','3 句','4 句','8 句'], a: 2, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn8',  q: '"大"的反义词是？', opts: ['中','小','多','长'], a: 1, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn9',  q: '下列哪个是表示"看"的字？', opts: ['听','视','嗅','言'], a: 1, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn10', q: '"书"字的偏旁是？', opts: ['亠','聿','木','竹'], a: 1, exp: 5, diff: 'easy', subject: 'chinese' },
    { id: 'cn11', q: '"锄禾日当午"的作者是？', opts: ['李白','杜甫','李绅','王维'], a: 2, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn12', q: '下列哪个是 ABB 式词语？', opts: ['高兴','红彤彤','走来走去','干干净净'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn13', q: '"咏鹅"的作者是？', opts: ['骆宾王','李白','王之涣','孟浩然'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn14', q: '"登鹳雀楼"中"更上一层楼"前一句是？', opts: ['白日依山尽','黄河入海流','欲穷千里目','床前明月光'], a: 2, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn15', q: '下列哪个是 AABB 式词语？', opts: ['红彤彤','高高兴兴','走来走去','看一看'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn16', q: '"春晓"的作者是？', opts: ['孟浩然','李白','杜甫','白居易'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn17', q: '下列哪个是表示"笑"的词语？', opts: ['啼哭','微笑','怒吼','呐喊'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn18', q: '"三人行"的下一句是？', opts: ['必有我师焉','必有我友','必有我父','必有我母'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn19', q: '下列哪组都是四字词语？', opts: ['太阳 月亮','红红火火 生机勃勃','跑 跳 走','桌子 椅子'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn20', q: '"葡萄"的"萄"读轻声还是二声？', opts: ['轻声','二声','三声','四声'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn21', q: '下列哪个是《静夜思》的作者？', opts: ['李白','王维','孟浩然','王昌龄'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn22', q: '"千"的韵母是？', opts: ['an','ian','uan','in'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn23', q: '"漂亮"的近义词是？', opts: ['丑陋','美丽','难看','普通'], a: 1, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn24', q: '下列哪个是比喻句？', opts: ['他像小老虎一样勇猛','他很勇敢','他是男孩','他在跑步'], a: 0, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn25', q: '"子"的韵母是？', opts: ['a','i','u','er'], a: 3, exp: 10, diff: 'normal', subject: 'chinese' },
    { id: 'cn26', q: '下列哪首诗是描写春天？', opts: ['静夜思','春晓','登鹳雀楼','咏鹅'], a: 1, exp: 20, diff: 'hard', subject: 'chinese' },
    { id: 'cn27', q: '"举头望明月"的下一句是？', opts: ['疑是地上霜','低头思故乡','夜来风雨声','处处闻啼鸟'], a: 1, exp: 20, diff: 'hard', subject: 'chinese' },
    { id: 'cn28', q: '下列哪个不是《论语》中的句子？', opts: ['学而时习之','三人行必有我师焉','床前明月光','温故而知新'], a: 2, exp: 20, diff: 'hard', subject: 'chinese' },
    { id: 'cn29', q: '"白日依山尽"的下一句是？', opts: ['黄河入海流','欲穷千里目','更上一层楼','处处闻啼鸟'], a: 0, exp: 20, diff: 'hard', subject: 'chinese' },
    { id: 'cn30', q: '下列哪个成语形容"读书多、学问大"？', opts: ['学富五车','画蛇添足','守株待兔','刻舟求剑'], a: 0, exp: 20, diff: 'hard', subject: 'chinese' }
  ];

  // ----- 数学 30 题 -----
  var Q_MATH = [
    { id: 'm1',  q: '1 + 1 = ?', opts: ['1','2','3','4'], a: 1, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm2',  q: '5 + 3 = ?', opts: ['6','7','8','9'], a: 2, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm3',  q: '10 - 4 = ?', opts: ['5','6','7','8'], a: 1, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm4',  q: '2 × 3 = ?', opts: ['4','5','6','7'], a: 2, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm5',  q: '6 ÷ 2 = ?', opts: ['2','3','4','5'], a: 1, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm6',  q: '下列哪个是偶数？', opts: ['3','5','7','8'], a: 3, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm7',  q: '正方形有几条边？', opts: ['3','4','5','6'], a: 1, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm8',  q: '时钟 3 点整，时针和分针形成的角是？', opts: ['30°','60°','90°','120°'], a: 2, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm9',  q: '12 + 8 = ?', opts: ['18','19','20','21'], a: 2, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm10', q: '比 50 多 1 的数是？', opts: ['49','50','51','52'], a: 2, exp: 5, diff: 'easy', subject: 'math' },
    { id: 'm11', q: '25 × 4 = ?', opts: ['80','90','100','110'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm12', q: '三角形的内角和是？', opts: ['90°','180°','270°','360°'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm13', q: '1 小时 = ? 分钟', opts: ['30','60','90','100'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm14', q: '0.5 + 0.5 = ?', opts: ['0.1','1','1.5','2'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm15', q: '圆的周长公式是？', opts: ['πr','2πr','πr²','2πr²'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm16', q: '12 × 12 = ?', opts: ['121','132','144','156'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm17', q: '100 ÷ 4 = ?', opts: ['20','25','30','40'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm18', q: '最大的一位数是？', opts: ['1','5','9','10'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm19', q: '长方形有几条对称轴？', opts: ['1','2','3','4'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm20', q: '3.14 × 100 = ?', opts: ['3.14','31.4','314','3140'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm21', q: '0 × 99 = ?', opts: ['0','99','990','1'], a: 0, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm22', q: '15 的因数有几个？', opts: ['2','3','4','5'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm23', q: '一个数除以 7 余 3，下列哪个可能？', opts: ['10','15','17','20'], a: 2, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm24', q: '3² + 4² = ?', opts: ['12','25','49','7'], a: 1, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm25', q: '下列哪个分数最大？', opts: ['1/2','1/3','1/4','1/5'], a: 0, exp: 10, diff: 'normal', subject: 'math' },
    { id: 'm26', q: '方程 2x = 8，x = ?', opts: ['2','3','4','6'], a: 2, exp: 20, diff: 'hard', subject: 'math' },
    { id: 'm27', q: '1+2+3+...+10 = ?', opts: ['45','50','55','60'], a: 2, exp: 20, diff: 'hard', subject: 'math' },
    { id: 'm28', q: '质数是？', opts: ['只有 1 个因数','只有 2 个因数','有 3 个因数','没有因数'], a: 1, exp: 20, diff: 'hard', subject: 'math' },
    { id: 'm29', q: '等腰三角形的两个底角？', opts: ['不相等','相等','互补','垂直'], a: 1, exp: 20, diff: 'hard', subject: 'math' },
    { id: 'm30', q: '圆周率 π ≈ ?', opts: ['3.14','3.41','3.04','3.40'], a: 0, exp: 20, diff: 'hard', subject: 'math' }
  ];

  // ----- 英语 30 题 -----
  var Q_ENGLISH = [
    { id: 'e1',  q: '"Hello"是什么意思？', opts: ['再见','你好','谢谢','对不起'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e2',  q: '"Apple"的中文是？', opts: ['香蕉','苹果','橙子','葡萄'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e3',  q: '"Cat"是什么？', opts: ['狗','鸟','猫','鱼'], a: 2, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e4',  q: '字母表第 1 个字母是？', opts: ['A','B','C','D'], a: 0, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e5',  q: '"Thank you"表示？', opts: ['你好','谢谢','对不起','再见'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e6',  q: '"Dog"的中文是？', opts: ['猫','狗','鸭','羊'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e7',  q: '眼睛的英文是？', opts: ['Ear','Eye','Nose','Mouth'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e8',  q: '"Book"是什么？', opts: ['书','笔','纸','桌'], a: 0, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e9',  q: '一共有几个元音字母？', opts: ['3','4','5','6'], a: 2, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e10', q: '"Good morning"用于？', opts: ['晚上','早上','中午','下午'], a: 1, exp: 5, diff: 'easy', subject: 'english' },
    { id: 'e11', q: '"Red"的中文是？', opts: ['蓝色','绿色','红色','黄色'], a: 2, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e12', q: '哪个是数字 "seven"？', opts: ['5','6','7','8'], a: 2, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e13', q: '"I am a student"中"student"的意思是？', opts: ['老师','学生','医生','警察'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e14', q: '下列哪个是水果？', opts: ['Desk','Banana','Chair','Table'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e15', q: '复数 "book" 的复数是？', opts: ['book','books','bookes','bookies'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e16', q: '"Mother"的中文是？', opts: ['父亲','母亲','姐姐','哥哥'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e17', q: '下列哪个是颜色？', opts: ['Run','Blue','Eat','Sleep'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e18', q: 'am/is/are 是？', opts: ['名词','动词 be','形容词','副词'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e19', q: '"What is your name?"的意思是？', opts: ['你多大了','你叫什么名字','你是哪国人','你喜欢什么'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e20', q: '"Teacher"的中文是？', opts: ['学生','老师','医生','司机'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e21', q: '星期一的英文是？', opts: ['Tuesday','Monday','Sunday','Friday'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e22', q: '下列哪个是动物？', opts: ['Sun','Moon','Tiger','Star'], a: 2, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e23', q: '"How are you?"的回答是？', opts: ['I am 10','I am fine, thank you','My name is','Goodbye'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e24', q: '"Happy Birthday!"用于？', opts: ['新年','生日','毕业','结婚'], a: 1, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e25', q: '字母 "Z" 后面是？', opts: ['A','Y','X','Z'], a: 0, exp: 10, diff: 'normal', subject: 'english' },
    { id: 'e26', q: '复数 "child" 的正确形式是？', opts: ['childs','childes','children','childen'], a: 2, exp: 20, diff: 'hard', subject: 'english' },
    { id: 'e27', q: '"She is a girl"中的"she"指？', opts: ['他','她','它','他们'], a: 1, exp: 20, diff: 'hard', subject: 'english' },
    { id: 'e28', q: '一般现在时第三人称单数动词加？', opts: ['-ed','-ing','-s/-es','不变化'], a: 2, exp: 20, diff: 'hard', subject: 'english' },
    { id: 'e29', q: '"Beautiful"的中文是？', opts: ['丑陋的','美丽的','高大的','矮小的'], a: 1, exp: 20, diff: 'hard', subject: 'english' },
    { id: 'e30', q: '下列哪个是介词？', opts: ['Run','Beautiful','Under','Quickly'], a: 2, exp: 20, diff: 'hard', subject: 'english' }
  ];

  // ----- 科学 30 题 -----
  var Q_SCIENCE = [
    { id: 's1',  q: '水在什么温度结冰？', opts: ['0℃','10℃','100℃','50℃'], a: 0, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's2',  q: '植物通过什么吸收水分？', opts: ['叶子','根','花','茎'], a: 1, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's3',  q: '下列哪个是动物？', opts: ['树','玫瑰','猫','草'], a: 2, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's4',  q: '太阳从哪个方向升起？', opts: ['西','东','南','北'], a: 1, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's5',  q: '人的心脏在哪个位置？', opts: ['头部','胸部','腹部','腿部'], a: 1, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's6',  q: '下列哪种是哺乳动物？', opts: ['鱼','鸟','狗','青蛙'], a: 2, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's7',  q: '空气中含量最多的是？', opts: ['氧气','氮气','二氧化碳','氢气'], a: 1, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's8',  q: '植物的什么部位进行光合作用？', opts: ['根','茎','叶','花'], a: 2, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's9',  q: '下列哪个是导体？', opts: ['木头','塑料','铁','橡胶'], a: 2, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's10', q: '声音在哪种介质中传播最快？', opts: ['空气','水','真空','固体铁'], a: 3, exp: 5, diff: 'easy', subject: 'science' },
    { id: 's11', q: '水的化学式是？', opts: ['CO2','H2O','O2','N2'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's12', q: '下列哪个是脊椎动物？', opts: ['蚯蚓','蛇','蝴蝶','蜗牛'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's13', q: '光在真空中的速度约为？', opts: ['3×10⁵ km/s','3×10⁸ m/s','3×10⁶ m/s','3×10¹⁰ m/s'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's14', q: '下列哪个是化学反应？', opts: ['冰融化','水沸腾','铁生锈','糖溶解'], a: 2, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's15', q: '人体的骨骼有多少块？', opts: ['106','206','306','406'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's16', q: '下列哪个是细胞中的能量工厂？', opts: ['细胞核','线粒体','叶绿体','高尔基体'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's17', q: '地球公转一周需要？', opts: ['1 天','1 月','1 年','10 年'], a: 2, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's18', q: '下列哪个是物理变化？', opts: ['燃烧','铁生锈','水结冰','食物消化'], a: 2, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's19', q: '人的正常体温约为？', opts: ['35℃','37℃','39℃','40℃'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's20', q: '下列哪个是新能源？', opts: ['煤','石油','太阳能','天然气'], a: 2, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's21', q: 'DNA 主要存在于细胞的？', opts: ['细胞质','细胞核','细胞膜','液泡'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's22', q: '下列哪个是酸性物质？', opts: ['石灰水','食醋','肥皂水','盐水'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's23', q: '植物种子萌发需要的条件？', opts: ['只需要水','水、空气、适宜温度','只需要阳光','只需要土壤'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's24', q: '下列哪个是哺乳动物的特征？', opts: ['下蛋','胎生哺乳','用鳃呼吸','有羽毛'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's25', q: '声音的传播需要？', opts: ['真空','介质','光','电'], a: 1, exp: 10, diff: 'normal', subject: 'science' },
    { id: 's26', q: '元素周期表第 1 号元素是？', opts: ['氦','氢','氧','碳'], a: 1, exp: 20, diff: 'hard', subject: 'science' },
    { id: 's27', q: '牛顿第二定律公式？', opts: ['F=ma','E=mc²','V=IR','P=UI'], a: 0, exp: 20, diff: 'hard', subject: 'science' },
    { id: 's28', q: '光合作用的产物是？', opts: ['水和二氧化碳','氧气和葡萄糖','二氧化碳和葡萄糖','氧气和水'], a: 1, exp: 20, diff: 'hard', subject: 'science' },
    { id: 's29', q: '人体最大的器官是？', opts: ['肝脏','皮肤','肺','肾脏'], a: 1, exp: 20, diff: 'hard', subject: 'science' },
    { id: 's30', q: '下列哪个是 DNA 的碱基？', opts: ['葡萄糖','腺嘌呤','氨基酸','脂肪酸'], a: 1, exp: 20, diff: 'hard', subject: 'science' }
  ];

  // ----- 政治 30 题 -----
  var Q_POLITICS = [
    { id: 'p1',  q: '我国的首都是？', opts: ['上海','北京','广州','深圳'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p2',  q: '我国的国旗是？', opts: ['五星红旗','青天白日','星条旗','米字旗'], a: 0, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p3',  q: '我国现任国家主席的全名是？', opts: ['毛泽东','邓小平','习近平','江泽民'], a: 2, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p4',  q: '"我"是什么字？', opts: ['第二人称','第一人称','第三人称','不定人称'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p5',  q: '过马路应该看什么灯？', opts: ['红灯','绿灯','黄灯','蓝灯'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p6',  q: '下列哪项是良好的学习习惯？', opts: ['边看电视边写作业','先玩后学','专心听课','抄袭作业'], a: 2, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p7',  q: '我们国家位于哪个洲？', opts: ['欧洲','美洲','亚洲','非洲'], a: 2, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p8',  q: '我国的母亲河是？', opts: ['长江','黄河','珠江','松花江'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p9',  q: '少先队员敬礼是？', opts: ['左手','右手','双手','都行'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p10', q: '打电话时应先说什么？', opts: ['再见','喂，你好','谢谢','对不起'], a: 1, exp: 5, diff: 'easy', subject: 'politics' },
    { id: 'p11', q: '中华人民共和国成立于哪一年？', opts: ['1949','1950','1939','1969'], a: 0, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p12', q: '我国的根本大法是？', opts: ['刑法','民法','宪法','行政法'], a: 2, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p13', q: '下列哪项属于不文明行为？', opts: ['排队上车','随地吐痰','尊老爱幼','爱护公物'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p14', q: '我国有多少个民族？', opts: ['50','56','58','60'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p15', q: '下列哪项是公民的基本义务？', opts: ['玩游戏','受教育','看电影','旅游'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p16', q: '我国的国徽上有几颗星？', opts: ['3','4','5','6'], a: 2, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p17', q: '中国共产党的宗旨是？', opts: ['为人民服务','为党员服务','为富人服务','为自己服务'], a: 0, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p18', q: '下列哪项是正确消费观？', opts: ['盲目攀比','理性消费','铺张浪费','奢侈消费'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p19', q: '我们应如何对待残疾人？', opts: ['歧视','嘲笑','关爱帮助','漠视'], a: 2, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p20', q: '"爱国"的核心是？', opts: ['爱家乡','对祖国的忠诚','爱美食','爱旅游'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p21', q: '我国的政体是？', opts: ['君主立宪制','人民代表大会制度','总统制','议会制'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p22', q: '下列哪项是诚信的表现？', opts: ['撒谎','守时','作弊','赖账'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p23', q: '网络交友应该？', opts: ['轻信陌生人','谨慎不泄露隐私','随便告诉地址','约见面'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p24', q: '我们应如何对待传统节日？', opts: ['全部过洋节','传承中华传统节日','无所谓','只过生日'], a: 1, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p25', q: '下列哪个是基本国策？', opts: ['计划生育','保护环境','对外开放','以上都是'], a: 3, exp: 10, diff: 'normal', subject: 'politics' },
    { id: 'p26', q: '"两个一百年"中的第一个百年目标是？', opts: ['建党 100 年','建国 100 年','建军 100 年','改革开放 100 年'], a: 0, exp: 20, diff: 'hard', subject: 'politics' },
    { id: 'p27', q: '我国的社会主要矛盾是？', opts: ['人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾','生产落后','阶级矛盾','以上都不是'], a: 0, exp: 20, diff: 'hard', subject: 'politics' },
    { id: 'p28', q: '我国的基本经济制度是？', opts: ['公有制为主体','多种所有制经济共同发展','前两者结合','私有制'], a: 2, exp: 20, diff: 'hard', subject: 'politics' },
    { id: 'p29', q: '社会主义核心价值观中国家层面的价值是？', opts: ['爱国','富强、民主、文明、和谐','敬业','诚信'], a: 1, exp: 20, diff: 'hard', subject: 'politics' },
    { id: 'p30', q: '我国实行的民族政策是？', opts: ['民族歧视','民族区域自治','民族压迫','民族分裂'], a: 1, exp: 20, diff: 'hard', subject: 'politics' }
  ];

  // ----- 历史 30 题 -----
  var Q_HISTORY = [
    { id: 'h1',  q: '我国最早的文字是？', opts: ['汉字','甲骨文','楔形文字','象形文字'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h2',  q: '秦始皇姓什么？', opts: ['赵','嬴','李','刘'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h3',  q: '四大发明不包括？', opts: ['造纸术','指南针','火药','电话'], a: 3, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h4',  q: '我国第一个统一封建王朝是？', opts: ['汉朝','秦朝','唐朝','明朝'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h5',  q: '孔子是哪国人？', opts: ['秦国','齐国','鲁国','楚国'], a: 2, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h6',  q: '长城始建于哪个朝代？', opts: ['秦朝','唐朝','明朝','清朝'], a: 0, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h7',  q: '丝绸之路是哪个朝代开辟的？', opts: ['秦朝','汉朝','唐朝','宋朝'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h8',  q: '三国指哪三国？', opts: ['秦汉唐','魏蜀吴','宋元明','春夏秋'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h9',  q: '唐朝开国皇帝是？', opts: ['李世民','李渊','李隆基','李治'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h10', q: '下列哪个是清朝皇帝？', opts: ['朱元璋','康熙','刘邦','赵匡胤'], a: 1, exp: 5, diff: 'easy', subject: 'history' },
    { id: 'h11', q: '"贞观之治"是哪个皇帝在位时期？', opts: ['唐太宗','唐玄宗','武则天','唐高宗'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h12', q: '鸦片战争发生在哪一年？', opts: ['1840','1842','1900','1911'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h13', q: '辛亥革命发生在哪一年？', opts: ['1911','1919','1949','1945'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h14', q: '中华人民共和国成立于哪一年？', opts: ['1945','1949','1950','1956'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h15', q: '下列哪个是古代丝绸之路的起点？', opts: ['长安','洛阳','开封','南京'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h16', q: '京杭大运河始建于哪个朝代？', opts: ['秦朝','隋朝','唐朝','宋朝'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h17', q: '下列哪位是四大名著作者？', opts: ['李白','苏轼','罗贯中','杜甫'], a: 2, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h18', q: '"五四运动"发生在哪一年？', opts: ['1911','1919','1921','1949'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h19', q: '中国共产党成立于哪一年？', opts: ['1919','1921','1927','1949'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h20', q: '文景之治发生在哪个朝代？', opts: ['秦朝','汉朝','唐朝','宋朝'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h21', q: '"开元盛世"是指哪个皇帝？', opts: ['唐太宗','唐高宗','唐玄宗','武则天'], a: 2, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h22', q: '下列哪个不是四大发明？', opts: ['造纸术','印刷术','地动仪','火药'], a: 2, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h23', q: '谁写成《史记》？', opts: ['司马迁','司马光','班固','孔子'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h24', q: '元朝的建立者是？', opts: ['成吉思汗','忽必烈','努尔哈赤','皇太极'], a: 1, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h25', q: '明朝开国皇帝是？', opts: ['朱元璋','朱棣','朱允炆','朱由检'], a: 0, exp: 10, diff: 'normal', subject: 'history' },
    { id: 'h26', q: '甲午中日战争发生在哪一年？', opts: ['1840','1894','1900','1937'], a: 1, exp: 20, diff: 'hard', subject: 'history' },
    { id: 'h27', q: '遵义会议召开于哪一年？', opts: ['1927','1935','1945','1949'], a: 1, exp: 20, diff: 'hard', subject: 'history' },
    { id: 'h28', q: '我国第一部纪传体通史是？', opts: ['《资治通鉴》','《史记》','《汉书》','《春秋》'], a: 1, exp: 20, diff: 'hard', subject: 'history' },
    { id: 'h29', q: '解放战争三大战役不包括？', opts: ['辽沈战役','淮海战役','平津战役','百团大战'], a: 3, exp: 20, diff: 'hard', subject: 'history' },
    { id: 'h30', q: '春秋五霸第一位是？', opts: ['齐桓公','晋文公','楚庄王','秦穆公'], a: 0, exp: 20, diff: 'hard', subject: 'history' }
  ];

  // ----- 音乐 30 题 -----
  var Q_MUSIC = [
    { id: 'mu1',  q: '简谱中"1"代表哪个音？', opts: ['Do','Re','Mi','Fa'], a: 0, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu2',  q: '下列哪种乐器是弦乐器？', opts: ['钢琴','小提琴','笛子','鼓'], a: 1, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu3',  q: '"哆"对应的字母是？', opts: ['C','D','E','F'], a: 0, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu4',  q: '二胡有几根弦？', opts: ['1 根','2 根','3 根','4 根'], a: 1, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu5',  q: '下列哪个是打击乐器？', opts: ['钢琴','笛子','鼓','小提琴'], a: 2, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu6',  q: '高音符号又叫？', opts: ['低音谱号','高音谱号','中音谱号','次中音谱号'], a: 1, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu7',  q: '"中华人民共和国国歌"原名是？', opts: ['歌唱祖国','义勇军进行曲','东方红','我的祖国'], a: 1, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu8',  q: '钢琴有多少个键？', opts: ['76','82','88','100'], a: 2, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu9',  q: '全音符比二分音符？', opts: ['短','长','相同','不一定'], a: 1, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu10', q: '"do re mi fa sol"有几个音？', opts: ['3','4','5','7'], a: 2, exp: 5, diff: 'easy', subject: 'music' },
    { id: 'mu11', q: '下列哪部作品是贝多芬的？', opts: ['命运交响曲','天鹅湖','胡桃夹子','茶花女'], a: 0, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu12', q: '古筝有多少根弦？', opts: ['13','18','21','25'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu13', q: '指挥家在乐队前面做什么？', opts: ['演奏','指挥','唱歌','记谱'], a: 1, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu14', q: '五线谱由几条线组成？', opts: ['3 条','4 条','5 条','6 条'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu15', q: '下列哪位是音乐家？', opts: ['贝多芬','达芬奇','爱因斯坦','牛顿'], a: 0, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu16', q: '4/4 拍中，每小节有几拍？', opts: ['2 拍','3 拍','4 拍','6 拍'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu17', q: '吉他属于？', opts: ['打击乐','弹拨乐','管乐','弦乐'], a: 1, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu18', q: '小提琴有几根弦？', opts: ['2 根','3 根','4 根','5 根'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu19', q: '表示"渐强"的标记是？', opts: ['p','f','cresc.','accel.'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu20', q: '中国民族乐器"笛子"属于？', opts: ['弹拨乐','打击乐','拉弦乐','吹管乐'], a: 3, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu21', q: '交响乐团有哪几个乐器组？', opts: ['弦乐','木管','铜管与打击乐','以上都是'], a: 3, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu22', q: '下列哪个是舞曲？', opts: ['小夜曲','圆舞曲','摇篮曲','进行曲'], a: 1, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu23', q: '"二泉映月"是哪类乐曲？', opts: ['古筝曲','二胡曲','琵琶曲','笛曲'], a: 1, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu24', q: '钢琴最初被称为什么？', opts: ['古钢琴','翼琴','强弱琴','水晶琴'], a: 2, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu25', q: '下列哪个是节拍标记？', opts: ['mf','4/4','pp','ff'], a: 1, exp: 10, diff: 'normal', subject: 'music' },
    { id: 'mu26', q: '肖邦是哪个国家的作曲家？', opts: ['德国','奥地利','波兰','法国'], a: 2, exp: 20, diff: 'hard', subject: 'music' },
    { id: 'mu27', q: '莫扎特创作了多少部交响曲？', opts: ['9 部','41 部','100 部','30 部'], a: 1, exp: 20, diff: 'hard', subject: 'music' },
    { id: 'mu28', q: '京剧"四大行当"不包括？', opts: ['生','旦','净','唱'], a: 3, exp: 20, diff: 'hard', subject: 'music' },
    { id: 'mu29', q: '十二平均律由谁确立？', opts: ['巴赫','贝多芬','莫扎特','亨德尔'], a: 0, exp: 20, diff: 'hard', subject: 'music' },
    { id: 'mu30', q: '协奏曲中独奏乐器与乐队的对比叫？', opts: ['华彩乐段','竞奏','主旋律','副歌'], a: 0, exp: 20, diff: 'hard', subject: 'music' }
  ];

  // ----- 美术 30 题 -----
  var Q_ART = [
    { id: 'ar1',  q: '三原色不包括？', opts: ['红','黄','蓝','绿'], a: 3, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar2',  q: '画笔的"三君子"指？', opts: ['毛笔、铅笔、钢笔','水彩笔、蜡笔、油画笔','以上都是','都不是'], a: 0, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar3',  q: '红 + 黄 = ？', opts: ['绿','紫','橙','蓝'], a: 2, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar4',  q: '下列哪位是画家？', opts: ['贝多芬','齐白石','爱迪生','鲁迅'], a: 1, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar5',  q: '画人物脸用的常见形状是？', opts: ['正方形','圆形','三角形','椭圆形'], a: 3, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar6',  q: '蓝 + 黄 = ？', opts: ['绿','紫','橙','黑'], a: 0, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar7',  q: '下列哪种不是绘画工具？', opts: ['铅笔','水彩笔','橡皮','锅'], a: 3, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar8',  q: '国画用的墨是？', opts: ['红色墨','黑色墨','蓝色墨','彩色墨'], a: 1, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar9',  q: '"蒙娜丽莎"的作者是？', opts: ['达芬奇','梵高','毕加索','莫奈'], a: 0, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar10', q: '美术课用的纸张常见有？', opts: ['白纸','卡纸','彩纸','以上都是'], a: 3, exp: 5, diff: 'easy', subject: 'art' },
    { id: 'ar11', q: '红 + 蓝 = ？', opts: ['绿','紫','橙','黑'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar12', q: '中国画"四君子"指？', opts: ['梅兰竹菊','松竹梅兰','松竹梅菊','以上都不是'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar13', q: '下列哪个是冷色？', opts: ['红','黄','蓝','橙'], a: 2, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar14', q: '下列哪个是暖色？', opts: ['蓝','绿','紫','红'], a: 3, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar15', q: '油画是用什么颜料画的？', opts: ['水彩','油画颜料','国画颜料','蜡笔'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar16', q: '下列哪位是印象派画家？', opts: ['莫奈','达芬奇','米开朗基罗','拉斐尔'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar17', q: '"向日葵"的作者是？', opts: ['莫奈','梵高','塞尚','高更'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar18', q: '漫画中"分镜"是指？', opts: ['分割画面讲故事','镜头摄影','电影片段','以上都不是'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar19', q: '中国画讲究"三远"不包括？', opts: ['高远','深远','平远','长远'], a: 3, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar20', q: '工笔与写意的区别？', opts: ['工笔细致、写意豪放','工笔豪放、写意细致','一样','以上都不是'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar21', q: '对比色是指？', opts: ['相邻色','互补色','同类色','任意色'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar22', q: '漫画中"对话框"一般是？', opts: ['正方形','圆形或方形','三角形','菱形'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar23', q: '雕塑家罗丹的代表作是？', opts: ['思想者','大卫','维纳斯','掷铁饼者'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar24', q: '剪纸属于？', opts: ['国画','民间美术','油画','版画'], a: 1, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar25', q: '"永字八法"是讲？', opts: ['写字的笔画','画画','弹琴','舞蹈'], a: 0, exp: 10, diff: 'normal', subject: 'art' },
    { id: 'ar26', q: '包豪斯是？', opts: ['画家','设计学院','艺术家','音乐家'], a: 1, exp: 20, diff: 'hard', subject: 'art' },
    { id: 'ar27', q: '中国画"墨分五色"指？', opts: ['焦浓重淡清','红黄蓝白黑','五种墨水','五种画笔'], a: 0, exp: 20, diff: 'hard', subject: 'art' },
    { id: 'ar28', q: '达芬奇的名画《最后的晚餐》位于？', opts: ['梵蒂冈','意大利米兰','法国巴黎','英国伦敦'], a: 1, exp: 20, diff: 'hard', subject: 'art' },
    { id: 'ar29', q: '"解构主义"代表人物是？', opts: ['贝聿铭','扎哈哈迪德','安藤忠雄','赖特'], a: 1, exp: 20, diff: 'hard', subject: 'art' },
    { id: 'ar30', q: '点彩派的代表画家是？', opts: ['修拉','莫奈','梵高','塞尚'], a: 0, exp: 20, diff: 'hard', subject: 'art' }
  ];

  var QUESTIONS = [].concat(Q_CHINESE, Q_MATH, Q_ENGLISH, Q_SCIENCE, Q_POLITICS, Q_HISTORY, Q_MUSIC, Q_ART);

  // ============== 8. DICT 词典（50+ 词条）==============
  var DICT = [
    { pinyin: 'píng guǒ', meaning: '苹果', en: 'apple', example: '我喜欢吃苹果。', near: ['梨子','香蕉'], ant: [], sentence: '红红的苹果像灯笼。' },
    { pinyin: 'xué xí', meaning: '学习', en: 'study', example: '我们正在学习。', near: ['读书','用功'], ant: ['玩耍'], sentence: '学习使人进步。' },
    { pinyin: 'yǒu yì', meaning: '友谊', en: 'friendship', example: '我们的友谊长存。', near: ['友情','交情'], ant: ['仇恨'], sentence: '真正的友谊是无价的。' },
    { pinyin: 'chéng shí', meaning: '诚实', en: 'honest', example: '做人要诚实。', near: ['真诚','老实'], ant: ['虚伪'], sentence: '诚实是金。' },
    { pinyin: 'ài', meaning: '爱', en: 'love', example: '我爱我的祖国。', near: ['喜爱','热爱'], ant: ['恨'], sentence: '爱是一种力量。' },
    { pinyin: 'shū', meaning: '书', en: 'book', example: '我正在看书。', near: ['书本','书籍'], ant: [], sentence: '书中自有黄金屋。' },
    { pinyin: 'jiā', meaning: '家', en: 'home', example: '我的家很温暖。', near: ['家庭','住所'], ant: [], sentence: '家是最温暖的港湾。' },
    { pinyin: 'tiān kōng', meaning: '天空', en: 'sky', example: '天空湛蓝。', near: ['苍穹','天穹'], ant: [], sentence: '天空飘着几朵白云。' },
    { pinyin: 'hǎi yáng', meaning: '海洋', en: 'ocean', example: '海洋广阔无垠。', near: ['大海','汪洋'], ant: ['陆地'], sentence: '海洋是生命之源。' },
    { pinyin: 'shān', meaning: '山', en: 'mountain', example: '高耸的山峰。', near: ['山峰','山脉'], ant: ['海'], sentence: '山高水长。' },
    { pinyin: 'hé liú', meaning: '河流', en: 'river', example: '长江是著名的河流。', near: ['江河','溪流'], ant: [], sentence: '河流奔向大海。' },
    { pinyin: 'míng tiān', meaning: '明天', en: 'tomorrow', example: '明天会更好。', near: ['明日','来日'], ant: ['昨天'], sentence: '明天是新的开始。' },
    { pinyin: 'zuó tiān', meaning: '昨天', en: 'yesterday', example: '昨天我去过公园。', near: ['昨日','前天'], ant: ['明天'], sentence: '昨天已成为回忆。' },
    { pinyin: 'jīn tiān', meaning: '今天', en: 'today', example: '今天是星期一。', near: ['今日','当天'], ant: [], sentence: '今天的事今天做。' },
    { pinyin: 'hǎo', meaning: '好', en: 'good', example: '你做得真好。', near: ['佳','优','良'], ant: ['坏','差'], sentence: '好人一生平安。' },
    { pinyin: 'dà', meaning: '大', en: 'big', example: '大象很大。', near: ['巨大','宏大'], ant: ['小'], sentence: '大公无私。' },
    { pinyin: 'xiǎo', meaning: '小', en: 'small', example: '小猫很小。', near: ['微小','细小'], ant: ['大'], sentence: '小草也有春天。' },
    { pinyin: 'gāo', meaning: '高', en: 'tall', example: '他长得很高。', near: ['高大','崇高'], ant: ['低','矮'], sentence: '高山流水遇知音。' },
    { pinyin: 'gōng zuò', meaning: '工作', en: 'work', example: '他努力工作。', near: ['劳动','任务'], ant: ['休息'], sentence: '工作是为了更好地生活。' },
    { pinyin: 'péng yǒu', meaning: '朋友', en: 'friend', example: '他是我最好的朋友。', near: ['友人','伙伴'], ant: ['敌人'], sentence: '朋友多了路好走。' },
    { pinyin: 'xìng fú', meaning: '幸福', en: 'happiness', example: '家庭幸福。', near: ['快乐','美满'], ant: ['痛苦'], sentence: '幸福是奋斗出来的。' },
    { pinyin: 'chūn tiān', meaning: '春天', en: 'spring', example: '春天百花盛开。', near: ['春季','春'], ant: ['秋天'], sentence: '春天来了。' },
    { pinyin: 'xià tiān', meaning: '夏天', en: 'summer', example: '夏天很热。', near: ['夏季','夏日'], ant: ['冬天'], sentence: '夏天是游泳的季节。' },
    { pinyin: 'qiū tiān', meaning: '秋天', en: 'autumn', example: '秋天是收获的季节。', near: ['秋季','秋'], ant: ['春天'], sentence: '秋天的枫叶红了。' },
    { pinyin: 'dōng tiān', meaning: '冬天', en: 'winter', example: '冬天下雪。', near: ['冬季','冬日'], ant: ['夏天'], sentence: '冬天来了，春天还会远吗？' },
    { pinyin: 'yuè liang', meaning: '月亮', en: 'moon', example: '月亮挂在天空。', near: ['明月','月球'], ant: ['太阳'], sentence: '月亮代表我的心。' },
    { pinyin: 'tài yáng', meaning: '太阳', en: 'sun', example: '太阳从东方升起。', near: ['日光','阳光'], ant: ['月亮'], sentence: '太阳是万物之源。' },
    { pinyin: 'xīng xing', meaning: '星星', en: 'star', example: '夜晚天上的星星。', near: ['星辰','繁星'], ant: [], sentence: '星星之火可以燎原。' },
    { pinyin: 'shuǐ', meaning: '水', en: 'water', example: '我们要节约用水。', near: ['清水','流水'], ant: ['火'], sentence: '水是生命之源。' },
    { pinyin: 'huǒ', meaning: '火', en: 'fire', example: '小心火烛。', near: ['火焰','火星'], ant: ['水'], sentence: '火能带来温暖也能带来灾难。' },
    { pinyin: 'shù', meaning: '树', en: 'tree', example: '门前有一棵大树。', near: ['树木','大树'], ant: [], sentence: '十年树木，百年树人。' },
    { pinyin: 'huā', meaning: '花', en: 'flower', example: '花儿真美。', near: ['花朵','鲜花'], ant: [], sentence: '花儿为什么这样红。' },
    { pinyin: 'niǎo', meaning: '鸟', en: 'bird', example: '鸟儿在空中飞翔。', near: ['飞鸟','小鸟'], ant: [], sentence: '鸟语花香。' },
    { pinyin: 'yú', meaning: '鱼', en: 'fish', example: '鱼在水里游。', near: ['鱼儿','鲜鱼'], ant: [], sentence: '鱼与熊掌不可兼得。' },
    { pinyin: 'māo', meaning: '猫', en: 'cat', example: '我家有一只猫。', near: ['小猫','猫咪'], ant: ['狗'], sentence: '猫是老鼠的天敌。' },
    { pinyin: 'gǒu', meaning: '狗', en: 'dog', example: '狗是人类的好朋友。', near: ['小狗','犬'], ant: ['猫'], sentence: '狗是人类最忠诚的朋友。' },
    { pinyin: 'mā ma', meaning: '妈妈', en: 'mom', example: '妈妈很爱我。', near: ['母亲','娘'], ant: ['爸爸'], sentence: '妈妈的爱最伟大。' },
    { pinyin: 'bà ba', meaning: '爸爸', en: 'dad', example: '爸爸去上班。', near: ['父亲','爸'], ant: ['妈妈'], sentence: '爸爸是家里的顶梁柱。' },
    { pinyin: 'lǎo shī', meaning: '老师', en: 'teacher', example: '老师教我们知识。', near: ['教师','先生'], ant: ['学生'], sentence: '老师是人类灵魂的工程师。' },
    { pinyin: 'xué sheng', meaning: '学生', en: 'student', example: '我是一名学生。', near: ['学子','同学'], ant: ['老师'], sentence: '学生应该好好学习。' },
    { pinyin: 'hóng', meaning: '红', en: 'red', example: '红旗飘飘。', near: ['红色','赤'], ant: ['绿'], sentence: '红色是喜庆的颜色。' },
    { pinyin: 'lán', meaning: '蓝', en: 'blue', example: '蓝色的天空。', near: ['蓝色','宝蓝'], ant: ['橙'], sentence: '蓝天白云真美丽。' },
    { pinyin: 'lǜ', meaning: '绿', en: 'green', example: '绿色的小草。', near: ['绿色','翠绿'], ant: ['红'], sentence: '绿水青山就是金山银山。' },
    { pinyin: 'huáng', meaning: '黄', en: 'yellow', example: '黄色的菊花。', near: ['黄色','金黄'], ant: [], sentence: '黄河是中华民族的母亲河。' },
    { pinyin: 'bái', meaning: '白', en: 'white', example: '白色的云朵。', near: ['白色','雪白'], ant: ['黑'], sentence: '白衣天使守护人民。' },
    { pinyin: 'hēi', meaning: '黑', en: 'black', example: '黑色的眼睛。', near: ['黑色','墨黑'], ant: ['白'], sentence: '黑夜里最亮的星。' },
    { pinyin: 'ài guó', meaning: '爱国', en: 'patriotic', example: '我们要热爱祖国。', near: ['爱民','忠诚'], ant: ['卖国'], sentence: '爱国是每个人应有的情怀。' },
    { pinyin: 'chéng jì', meaning: '成绩', en: 'grade', example: '我这次成绩不错。', near: ['分数','成果'], ant: [], sentence: '成绩是努力的结果。' },
    { pinyin: 'shēn tǐ', meaning: '身体', en: 'body', example: '身体健康很重要。', near: ['躯体','身材'], ant: ['心灵'], sentence: '身体是革命的本钱。' },
    { pinyin: 'xīn', meaning: '心', en: 'heart', example: '一颗红心向太阳。', near: ['心脏','内心'], ant: [], sentence: '心想事成。' },
    { pinyin: 'mèng xiǎng', meaning: '梦想', en: 'dream', example: '每个人都有自己的梦想。', near: ['理想','志向'], ant: ['现实'], sentence: '有梦想就有希望。' },
    { pinyin: 'yǒng gǎn', meaning: '勇敢', en: 'brave', example: '他很勇敢。', near: ['英勇','坚强'], ant: ['胆怯'], sentence: '勇敢面对困难。' }
  ];

  // ============== 9. ARTICLES 课文（5 篇）==============
  var ARTICLES = [
    {
      title: '静夜思', author: '李白', grade: 'g1up',
      text: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
      translation: '明亮的月光洒在床前的窗户纸上，好像地上泛起了一层白霜。我抬起头来，看那天窗外空中的明月，不由得低头沉思，想起远方的家乡。'
    },
    {
      title: '悯农', author: '李绅', grade: 'g2up',
      text: '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。',
      translation: '农民在正午烈日的暴晒下锄禾，汗水从身上滴在禾苗生长的土地上。又有谁知道盘中的饭食，每颗每粒都是农民用辛勤的劳动换来的呢？'
    },
    {
      title: '登鹳雀楼', author: '王之涣', grade: 'g2up',
      text: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
      translation: '夕阳依傍着西山慢慢地沉没，滔滔黄河朝着东海汹涌奔流。若想把千里的风光景物看够，那就要登上更高的一层城楼。'
    },
    {
      title: '咏鹅', author: '骆宾王', grade: 'g1up',
      text: '鹅，鹅，鹅，曲项向天歌。\n白毛浮绿水，红掌拨清波。',
      translation: '"鹅，鹅，鹅！"面向蓝天，一群鹅儿弯曲着脖子对天唱着歌。雪白的羽毛漂浮在碧绿的水面上，红色的脚掌轻轻地划着清波。'
    },
    {
      title: '春晓', author: '孟浩然', grade: 'g2up',
      text: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
      translation: '春日里贪睡不知不觉天已破晓，搅乱我酣眠的是那啁啾的小鸟。昨天夜里风声雨声一直不断，那娇美的春花不知被吹落了多少？'
    },
    {
      title: '村居', author: '高鼎', grade: 'g3up',
      text: '草长莺飞二月天，拂堤杨柳醉春烟。\n儿童散学归来早，忙趁东风放纸鸢。',
      translation: '农历二月，青草渐渐发芽生长，黄莺飞来飞去，轻拂堤岸的杨柳沉醉在春天的雾气中。村里的孩子们放学回家时间还早，赶忙趁着东风把风筝放上蓝天。'
    }
  ];

  // ============== 10. EVENTS 活动 ==============
  var EVENTS = [
    { day: 1,  title: '新年立志', tip: '新的一年，新的开始！写下你的学习目标吧。', reward: { coin: 50, exp: 100 } },
    { day: 14, title: '情人节特别活动', tip: '送出一份学习祝福给好友吧。', reward: { coin: 30, exp: 60 } },
    { day: 23, title: '学习雷锋日', tip: '帮助同学解答一道难题。', reward: { coin: 30, exp: 60 } },
    { day: 3,  title: '学雷锋纪念日', tip: '和同学一起讨论一道题吧。', reward: { coin: 20, exp: 40 } },
    { day: 8,  title: '三八妇女节', tip: '给妈妈/老师说一句祝福。', reward: { coin: 20, exp: 40 } },
    { day: 12, title: '植树节', tip: '了解一种植物的小知识。', reward: { coin: 30, exp: 60 } },
    { day: 4,  title: '清明节', tip: '背诵一首关于春天的诗。', reward: { coin: 50, exp: 100 } },
    { day: 1,  title: '劳动节', tip: '今天帮助家人做家务。', reward: { coin: 50, exp: 100 } },
    { day: 1,  title: '儿童节', tip: '儿童节特别：完成 5 道题即可获得双倍奖励。', reward: { coin: 100, exp: 200 } },
    { day: 1,  title: '建党节', tip: '了解一个中国共产党的历史小故事。', reward: { coin: 50, exp: 100 } },
    { day: 1,  title: '建军节', tip: '认识一位人民英雄。', reward: { coin: 50, exp: 100 } },
    { day: 10, title: '教师节', tip: '对老师说一声：老师您辛苦了。', reward: { coin: 50, exp: 100 } },
    { day: 1,  title: '国庆节', tip: '了解一个中国的世界之最。', reward: { coin: 100, exp: 200 } },
    { day: 25, title: '圣诞节', tip: '完成一次英语听力练习。', reward: { coin: 30, exp: 60 } },
    { day: 31, title: '跨年特别', tip: '在 12 月 31 日总结一年的学习成果。', reward: { coin: 200, exp: 500 } }
  ];

  // ============== 11. PRESET_AVATARS 头像（48 个 emoji）==============
  var PRESET_AVATARS = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
    '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳',
    '😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤',
    '😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫'
  ];

  // ============== 12. makeMapNodes 地图关卡（5 关模板）==============
  function makeMapNodes(subjectName) {
    return [
      { id: 'lv1', name: '入门关', icon: 'flag',   desc: '初探' + subjectName,   total: 5,  reward: { coin: 20,  exp: 50 },  star: 0, locked: false },
      { id: 'lv2', name: '基础关', icon: 'star',   desc: '掌握' + subjectName + '基础', total: 8,  reward: { coin: 40,  exp: 100 }, star: 0, locked: true },
      { id: 'lv3', name: '进阶关', icon: 'fire',   desc: '挑战' + subjectName + '进阶', total: 10, reward: { coin: 60,  exp: 150 }, star: 0, locked: true },
      { id: 'lv4', name: '高手关', icon: 'trophy', desc: subjectName + '高手对决', total: 12, reward: { coin: 80,  exp: 200 }, star: 0, locked: true },
      { id: 'lv5', name: '王者关', icon: 'crown',  desc: subjectName + '王者挑战', total: 15, reward: { coin: 150, exp: 400 }, star: 0, locked: true }
    ];
  }

  // ============== 13. makeDailyTasks 每日任务（4 个）==============
  function makeDailyTasks() {
    var dayKey = 'dd_day_' + new Date().toDateString();
    var stored = null;
    try { stored = window.localStorage && localStorage.getItem(dayKey); } catch (e) {}
    if (stored) {
      try { return JSON.parse(stored); } catch (e2) {}
    }
    var tasks = [
      { id: 'd1', name: '完成 5 道题',     icon: 'check',     target: 5,  current: 0, reward: { coin: 10, exp: 20 }, done: false },
      { id: 'd2', name: '答对 3 题',       icon: 'star',      target: 3,  current: 0, reward: { coin: 10, exp: 20 }, done: false },
      { id: 'd3', name: '学习 2 个学科',   icon: 'palette',   target: 2,  current: 0, reward: { coin: 15, exp: 30 }, done: false },
      { id: 'd4', name: '分享给好友 1 次', icon: 'share',     target: 1,  current: 0, reward: { coin: 20, exp: 50 }, done: false }
    ];
    try { window.localStorage && localStorage.setItem(dayKey, JSON.stringify(tasks)); } catch (e3) {}
    return tasks;
  }

  // ============== 工具方法 ==============
  /** 根据经验计算等级 */
  function calcLevel(exp) {
    return Math.floor(Math.sqrt(Math.max(0, exp) / 10)) + 1;
  }

  /** 根据等级获取下一级所需经验 */
  function nextLevelExp(level) {
    if (level >= 99) return Infinity;
    return (level) * (level) * 10;
  }

  /** 根据 ID 查找学科 */
  function findSubject(id) {
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].id === id) return SUBJECTS[i];
    return null;
  }

  // ============== V3 新增数据：教材资源 ==============
  // 语文 / 数学 / 英语（人教版），g1up/g3up/g5up 详细，其余简化
  var TEXTBOOKS = {
    // 语文 - 人教版
    chinese_pep: {
      g1up: {
        units: [
          { unit: 1, title: '识字', lessons: [
            { title: '天地人', content: '天地人 你我他' },
            { title: '金木水火土', content: '一二三四五，金木水火土。天地分上下，日月照今古。' },
            { title: '口耳目', content: '口耳目，手足心。' },
            { title: '日月水火', content: '日月水火，山石田禾。' },
            { title: '对韵歌', content: '云对雨，雪对风。花对树，鸟对虫。山清对水秀，柳暗对花明。' }
          ]},
          { unit: 2, title: '汉语拼音', lessons: [
            { title: 'a o e', content: 'a o e，圆嘴巴。' },
            { title: 'i u ü', content: 'i u ü，戴帽子。' },
            { title: 'b p m f', content: 'b p m f，右下半圆 b b b。' },
            { title: 'd t n l', content: 'd t n l，小鼓敲敲 d d d。' }
          ]},
          { unit: 3, title: '课文', lessons: [
            { title: '秋天', content: '秋天来了，天气凉了，树叶黄了，一片片叶子从树上落下来。一群大雁往南飞，一会儿排成个人字，一会儿排成个一字。啊！秋天来了！' },
            { title: '小小的船', content: '弯弯的月儿小小的船，小小的船儿两头尖。我在小小的船里坐，只看见闪闪的星星蓝蓝的天。' },
            { title: '江南', content: '江南可采莲，莲叶何田田。鱼戏莲叶间。鱼戏莲叶东，鱼戏莲叶西，鱼戏莲叶南，鱼戏莲叶北。' },
            { title: '四季', content: '草芽尖尖，他对小鸟说：我是春天。荷叶圆圆，他对青蛙说：我是夏天。谷穗弯弯，他鞠着躬说：我是秋天。雪人大肚子一挺，他顽皮地说：我就是冬天。' }
          ]}
        ],
        words: ['天','地','人','你','我','他','一','二','三','四','五','上','下','口','耳','目','手','足','日','月','水','火','山','石','田','禾','对','云','雨','雪','风','花','树','鸟','虫']
      },
      g2up: {
        units: [
          { unit: 1, title: '课文', lessons: [
            { title: '小蝌蚪找妈妈', content: '池塘里有一群小蝌蚪，大大的脑袋，黑灰色的身子...' },
            { title: '我是什么', content: '我会变。太阳一晒，我就变成汽...' },
            { title: '植物妈妈有办法', content: '孩子如果已经长大，就得告别妈妈，四海为家...' }
          ]},
          { unit: 2, title: '识字', lessons: [
            { title: '场景歌', content: '一只海鸥，一片沙滩。一艘军舰，一条帆船。' },
            { title: '树之歌', content: '杨树高，榕树壮，梧桐树叶像手掌。' }
          ]}
        ],
        words: ['孩','脑','袋','灰','教','捕','迎','阿','姨','宽','龟','顶','披','鼓']
      },
      g3up: {
        units: [
          { unit: 1, title: '第一单元', lessons: [
            { title: '我们的民族小学', content: '早晨，从山坡上，从坪坝里，从一条条开着绒球花和太阳花的小路上，走来了许多小学生，有傣族的，有景颇族的，有阿昌族和德昂族的，还有汉族的。' },
            { title: '金色的草地', content: '我们住在乡下，窗前是一大片草地。草地上长满了蒲公英。当蒲公英盛开的时候，这片草地就变成金色的了。' },
            { title: '爬天都峰', content: '假日里，爸爸带我去黄山，爬天都峰。我站在天都峰脚下抬头望：啊，峰顶这么高，在云彩上面哩！' }
          ]},
          { unit: 2, title: '第二单元', lessons: [
            { title: '灰雀', content: '有一年冬天，列宁在郊外养病。他每天到公园散步。公园里有一棵高大的白桦树，树上有三只灰雀。' },
            { title: '小摄影师', content: '1928年夏天，高尔基住在列宁格勒。他经常坐在窗子旁边工作。一个阳光明媚的早晨，高尔基正在读书。' },
            { title: '奇怪的大石头', content: '李四光小时候喜欢和伙伴们玩捉迷藏。他常常躲在一个大石头的后面，伙伴们怎么也找不到他。' }
          ]},
          { unit: 3, title: '第三单元', lessons: [
            { title: '古诗两首', content: '《夜书所见》：萧萧梧叶送寒声，江上秋风动客情。《望天门山》：天门中断楚江开，碧水东流至此回。' },
            { title: '风筝', content: '童年的时候，我们这些孩子，最大的快乐就是做风筝，放风筝。' }
          ]}
        ],
        words: ['晨','绒','球','汉','艳','服','装','扮','读','静','停','粗','影','戴','蝴','蝶','雀','舞','稻','峰','顶','似','苍','仰','丈']
      },
      g4up: {
        units: [
          { unit: 1, title: '第一单元', lessons: [
            { title: '观潮', content: '钱塘江大潮，自古以来被称为天下奇观。' },
            { title: '雅鲁藏布大峡谷', content: '雅鲁藏布大峡谷是世界上最深的峡谷之一。' }
          ]},
          { unit: 2, title: '第二单元', lessons: [
            { title: '古诗两首', content: '《题西林壁》：横看成岭侧成峰，远近高低各不同。' }
          ]}
        ],
        words: ['潮','称','盐','笼','罩','蒙','薄','雾','恢','涨','踏','崩','震','余']
      },
      g5up: {
        units: [
          { unit: 1, title: '第一单元', lessons: [
            { title: '白鹭', content: '白鹭是一首精巧的诗。色素的配合，身段的大小，一切都很适宜。' },
            { title: '落花生', content: '我们家的后园有半亩空地。母亲说：让它荒着怪可惜的，你们那么爱吃花生，就开辟出来种花生吧。' },
            { title: '桂花雨', content: '小时候，我最喜欢桂花。桂花树的样子笨笨的，不像梅树那样有姿态。' },
            { title: '珍珠鸟', content: '真好！朋友送我一对珍珠鸟。放在一个简易的竹条编成的笼子里，笼内还有一卷干草，那是小鸟舒适又温暖的巢。' }
          ]},
          { unit: 2, title: '第二单元', lessons: [
            { title: '搭石', content: '我的家乡有一条无名小溪，五六个小村庄分布在小溪的两岸。' },
            { title: '将相和', content: '战国时候，秦国最强，常常进攻别的国家。' },
            { title: '什么比猎豹的速度更快', content: '也许你跑得很快。不过如果你和猎豹赛跑，你一定输给猎豹。' }
          ]},
          { unit: 3, title: '第三单元', lessons: [
            { title: '牛郎织女（一）', content: '古时候有个孩子，爹娘都死了，跟着哥哥嫂子过日子。' }
          ]}
        ],
        words: ['鹭','鹤','嫌','朱','宜','榨','矮','苔','框','眶','浸','谴','惰','稳','衡','协']
      },
      g6up: {
        units: [
          { unit: 1, title: '第一单元', lessons: [
            { title: '草原', content: '这次，我看到了草原。那里的天比别处的更可爱，空气是那么清鲜，天空是那么明朗。' },
            { title: '丁香结', content: '今年的丁香花似乎开得格外茂盛。' }
          ]}
        ],
        words: ['毯','陈','裳','虹','蹄','腐','稍','微','缀','窥','幽','雅','案','拙','薄']
      },
      g1dn: { units: [{ unit: 1, title: '识字', lessons: [{ title: '春夏秋冬', content: '春风夏雨秋霜冬雪...' }] }], words: ['春','夏','秋','冬'] },
      g2dn: { units: [{ unit: 1, title: '课文', lessons: [{ title: '古诗二首', content: '《村居》：草长莺飞二月天...' }] }], words: ['诗','村','童'] },
      g3dn: { units: [{ unit: 1, title: '第一单元', lessons: [{ title: '燕子', content: '一身乌黑光亮的羽毛...' }] }], words: ['燕','聚','增','掠'] },
      g4dn: { units: [{ unit: 1, title: '第一单元', lessons: [{ title: '桂林山水', content: '人们都说：桂林山水甲天下。' }] }], words: ['澜','暇','翡','峦'] },
      g5dn: { units: [{ unit: 1, title: '第一单元', lessons: [{ title: '草原', content: '草原的景色真美。' }] }], words: ['毯','裳'] },
      g6dn: { units: [{ unit: 1, title: '第一单元', lessons: [{ title: '文言文两则', content: '学弈：弈秋，通国之善弈者也。' }] }], words: ['弈','孟'] }
    },
    // 数学 - 人教版
    math_pep: {
      g1up: {
        units: [
          { unit: 1, title: '准备课', topics: ['数一数','比多少'] },
          { unit: 2, title: '位置', topics: ['上下前后左右'] },
          { unit: 3, title: '1-5的认识和加减法', topics: ['1-5的认识','比大小','第几','分与合','加法','减法','0的认识'] },
          { unit: 4, title: '认识图形（一）', topics: ['立体图形'] },
          { unit: 5, title: '6-10的认识和加减法', topics: ['6和7','8和9','10的认识','连加连减','加减混合'] },
          { unit: 6, title: '11-20各数的认识', topics: ['数数','读数','写数','十加几','十几加几'] },
          { unit: 7, title: '认识钟表', topics: ['整时','半时'] },
          { unit: 8, title: '20以内的进位加法', topics: ['9加几','876加几','5432加几'] }
        ]
      },
      g2up: {
        units: [
          { unit: 1, title: '长度单位', topics: ['厘米和米','线段'] },
          { unit: 2, title: '100以内的加法和减法', topics: ['不进位加','进位加','不退位减','退位减'] },
          { unit: 3, title: '角的初步认识', topics: ['角的初步认识','直角'] },
          { unit: 4, title: '表内乘法（一）', topics: ['乘法的初步认识','2-6的乘法口诀'] }
        ]
      },
      g3up: {
        units: [
          { unit: 1, title: '时、分、秒', topics: ['秒的认识','时间计算'] },
          { unit: 2, title: '万以内的加法和减法（一）', topics: ['两位数加两位数','两位数减两位数','几百几十加减'] },
          { unit: 3, title: '测量', topics: ['毫米分米','千米','吨'] },
          { unit: 4, title: '万以内的加法和减法（二）', topics: ['三位数加三位数','三位数减三位数'] },
          { unit: 5, title: '倍的认识', topics: ['倍的概念','求倍数'] },
          { unit: 6, title: '多位数乘一位数', topics: ['口算乘法','笔算乘法','解决问题'] },
          { unit: 7, title: '长方形和正方形', topics: ['四边形','周长'] },
          { unit: 8, title: '分数的初步认识', topics: ['认识分数','分数简单计算'] }
        ]
      },
      g4up: {
        units: [
          { unit: 1, title: '大数的认识', topics: ['亿以内数的认识','亿以上数的认识'] },
          { unit: 2, title: '公顷和平方千米', topics: ['公顷','平方千米'] },
          { unit: 3, title: '角的度量', topics: ['线段直线射线','角的度量','角的分类'] },
          { unit: 4, title: '三位数乘两位数', topics: ['笔算乘法','速度时间路程'] }
        ]
      },
      g5up: {
        units: [
          { unit: 1, title: '小数乘法', topics: ['小数乘整数','小数乘小数','积的近似数','整数乘法运算定律推广'] },
          { unit: 2, title: '位置', topics: ['用数对确定位置'] },
          { unit: 3, title: '小数除法', topics: ['小数除以整数','一个数除以小数','商的近似数','循环小数'] },
          { unit: 4, title: '可能性', topics: ['事件发生的可能性'] },
          { unit: 5, title: '简易方程', topics: ['用字母表示数','方程的意义','解方程','实际问题与方程'] },
          { unit: 6, title: '多边形的面积', topics: ['平行四边形面积','三角形面积','梯形面积'] },
          { unit: 7, title: '数学广角', topics: ['植树问题'] }
        ]
      },
      g6up: {
        units: [
          { unit: 1, title: '分数乘法', topics: ['分数乘整数','分数乘分数','倒数的认识'] },
          { unit: 2, title: '位置与方向（二）', topics: ['方向与距离','路线图'] },
          { unit: 3, title: '分数除法', topics: ['分数除以整数','一个数除以分数','比'] },
          { unit: 4, title: '比', topics: ['比的意义和性质','按比分配'] }
        ]
      },
      g1dn: { units: [{ unit: 1, title: '认识图形（二）', topics: ['平面图形'] }] },
      g2dn: { units: [{ unit: 1, title: '数据收集整理', topics: ['统计'] }] },
      g3dn: { units: [{ unit: 1, title: '位置与方向', topics: ['东南西北'] }] },
      g4dn: { units: [{ unit: 1, title: '四则运算', topics: ['加减法','乘除法'] }] },
      g5dn: { units: [{ unit: 1, title: '观察物体（三）', topics: ['图形'] }] },
      g6dn: { units: [{ unit: 1, title: '负数', topics: ['负数的认识'] }] }
    },
    // 英语 - 人教版（三年级起点）
    english_pep: {
      g3up: {
        units: [
          { unit: 1, title: 'Hello', words: ['hello','hi','goodbye','bye','I','am','name','pencil','ruler','eraser','crayon','bag','pen','pencil-box','book'], sentences: ['Hello! Im Mike.','Whats your name?','My name is Chen Jie.','Goodbye!'] },
          { unit: 2, title: 'Colours', words: ['red','yellow','green','blue','black','white','orange','brown','pink','purple'], sentences: ['I see red.','Nice to meet you.','Colour it brown.'] },
          { unit: 3, title: 'Look at me', words: ['face','ear','eye','nose','mouth','head','body','arm','hand','leg','foot'], sentences: ['Look at me!','This is my face.','How are you?','Im fine, thank you.'] },
          { unit: 4, title: 'We love animals', words: ['pig','bear','cat','duck','dog','bird','monkey','panda','elephant','tiger'], sentences: ['Whats this?','Its a pig.','Look at the cat.','Act like an elephant.'] },
          { unit: 5, title: 'Lets eat', words: ['bread','juice','egg','milk','cake','water','fish','rice','beef','cake'], sentences: ['Id like some juice, please.','Have some bread.','Here you are.'] },
          { unit: 6, title: 'Happy birthday', words: ['one','two','three','four','five','six','seven','eight','nine','ten','brother','sister'], sentences: ['Happy birthday!','How old are you?','Im nine years old.','Lets eat the cake!'] }
        ]
      },
      g4up: {
        units: [
          { unit: 1, title: 'My classroom', words: ['window','door','picture','blackboard','light','classroom','computer','fan','wall','floor'], sentences: ['Whats in the classroom?','We have a new classroom.','Let me clean the window.'] },
          { unit: 2, title: 'My schoolbag', words: ['schoolbag','English book','maths book','Chinese book','notebook','storybook','key','candy','toy','notebook'], sentences: ['Whats in your schoolbag?','I have a new schoolbag.','Put your eraser on your nose.'] }
        ]
      },
      g5up: {
        units: [
          { unit: 1, title: 'Whats he like?', words: ['old','young','funny','kind','strict','polite','shy','helpful','clever','hard-working'], sentences: ['Whos your art teacher?','Mr Young.','Is he young?','Yes, he is.','Whats she like?','Shes kind.'] },
          { unit: 2, title: 'My week', words: ['Monday','Tuesday','Wednesday','Thursday','Friday','weekend','Saturday','Sunday','Chinese','maths','English','science','PE','music','art'], sentences: ['What do you have on Mondays?','We have PE, maths and English.','What do you do on Saturdays?','I often do my homework.'] },
          { unit: 3, title: 'What would you like?', words: ['sandwich','hamburger','salad','ice cream','tea','fresh','healthy','delicious','hot','sweet'], sentences: ['What would you like to eat?','Id like a hamburger, please.','Whats your favourite food?','I like fish.'] },
          { unit: 4, title: 'What can you do?', words: ['sing','dance','swim','cook','play basketball','play ping-pong','speak English','play the pipa','do kung fu','draw cartoons'], sentences: ['What can you do?','I can sing English songs.','Can you swim?','Yes, I can.'] },
          { unit: 5, title: 'There is a big bed', words: ['clock','plant','bottle','bike','photo','water bottle','front','between','above','beside'], sentences: ['There is a big bed.','Whats in the room?','There are so many pictures here.'] },
          { unit: 6, title: 'In a nature park', words: ['forest','river','lake','mountain','hill','tree','bridge','building','village','boating'], sentences: ['Is there a river in the park?','Yes, there is.','Are there any tall buildings?','No, there arent.'] }
        ]
      },
      g6up: {
        units: [
          { unit: 1, title: 'How do you go there?', words: ['by bike','by bus','by car','by train','by subway','on foot','traffic light','stop','wait','go'], sentences: ['How do you go to school?','I go by bike.','How can I get to the zoo?'] }
        ]
      },
      g3dn: { units: [{ unit: 1, title: 'Welcome back', words: ['boy','girl','student','teacher','UK','USA','China','Canada'], sentences: ['Welcome back!','Nice to see you again.'] }] },
      g4dn: { units: [{ unit: 1, title: 'My school', words: ['playground','library','teachers office','first floor','second floor'], sentences: ['Where is the library?','Its on the first floor.'] }] },
      g5dn: { units: [{ unit: 1, title: 'My day', words: ['do morning exercises','eat breakfast','have English class','play sports','eat dinner'], sentences: ['When do you get up?','I usually get up at 6:00.'] }] },
      g6dn: { units: [{ unit: 1, title: 'How tall are you?', words: ['taller','shorter','stronger','older','younger','bigger','smaller','longer','heavier','thinner'], sentences: ['How tall are you?','Im 160 cm tall.','Youre taller than me.'] }] }
    }
  };

  // ============== V3 新增数据：乐园材料库（60 种）==============
  var MATERIALS = [
    // 基础方块
    { id:'grass', name:'草地', emoji:'🟩', price:2, cat:'basic', color:'#4CAF50' },
    { id:'dirt', name:'泥土', emoji:'🟫', price:1, cat:'basic', color:'#8D6E63' },
    { id:'stone', name:'石头', emoji:'⬜', price:3, cat:'basic', color:'#9E9E9E' },
    { id:'wood', name:'木头', emoji:'🟧', price:5, cat:'basic', color:'#FFB74D' },
    { id:'sand', name:'沙子', emoji:'🟨', price:2, cat:'basic', color:'#FFD54F' },
    { id:'water', name:'水', emoji:'🟦', price:8, cat:'basic', color:'#42A5F5' },
    { id:'snow', name:'雪', emoji:'⬜', price:6, cat:'basic', color:'#E3F2FD' },
    { id:'lava', name:'岩浆', emoji:'🟥', price:15, cat:'basic', color:'#FF5252' },
    // 建筑材料
    { id:'brick', name:'砖块', emoji:'🧱', price:8, cat:'build', color:'#E57373' },
    { id:'plank', name:'木板', emoji:'🟫', price:6, cat:'build', color:'#A1887F' },
    { id:'glass', name:'玻璃', emoji:'▫️', price:10, cat:'build', color:'#B3E5FC' },
    { id:'door', name:'门', emoji:'🚪', price:20, cat:'build', color:'#8D6E63' },
    { id:'window', name:'窗户', emoji:'🪟', price:15, cat:'build', color:'#81D4FA' },
    { id:'roof', name:'屋顶', emoji:'🔺', price:12, cat:'build', color:'#D32F2F' },
    { id:'fence', name:'栅栏', emoji:'🚧', price:5, cat:'build', color:'#A1887F' },
    { id:'stairs', name:'楼梯', emoji:'🪜', price:18, cat:'build', color:'#BCAAA4' },
    // 装饰
    { id:'flower_r', name:'红花', emoji:'🌹', price:8, cat:'deco', color:'#E91E63' },
    { id:'flower_y', name:'黄花', emoji:'🌻', price:8, cat:'deco', color:'#FFC107' },
    { id:'flower_p', name:'紫花', emoji:'🌷', price:8, cat:'deco', color:'#9C27B0' },
    { id:'tree', name:'大树', emoji:'🌳', price:15, cat:'deco', color:'#388E3C' },
    { id:'tree_s', name:'小树', emoji:'🌲', price:10, cat:'deco', color:'#2E7D32' },
    { id:'bush', name:'灌木', emoji:'🌿', price:5, cat:'deco', color:'#66BB6A' },
    { id:'lamp', name:'路灯', emoji:'💡', price:20, cat:'deco', color:'#FFF176' },
    { id:'flag', name:'旗帜', emoji:'🚩', price:12, cat:'deco', color:'#F44336' },
    { id:'bench', name:'长椅', emoji:'🪑', price:15, cat:'deco', color:'#8D6E63' },
    // 国风
    { id:'tile_red', name:'红瓦', emoji:'🟥', price:15, cat:'cn', color:'#C62828' },
    { id:'wall_gray', name:'青砖', emoji:'⬜', price:10, cat:'cn', color:'#BDBDBD' },
    { id:'lantern', name:'灯笼', emoji:'🏮', price:25, cat:'cn', color:'#FF1744' },
    { id:'bridge', name:'石桥', emoji:'🌉', price:40, cat:'cn', color:'#90A4AE' },
    { id:'tower', name:'宝塔', emoji:'🗼', price:50, cat:'cn', color:'#A1887F' },
    { id:'lotus', name:'荷花', emoji:'🪷', price:20, cat:'cn', color:'#EC407A' },
    { id:'bamboo', name:'竹子', emoji:'🎋', price:12, cat:'cn', color:'#66BB6A' },
    // 美食街
    { id:'shop', name:'店铺', emoji:'🏪', price:30, cat:'food', color:'#FF8A65' },
    { id:'signboard', name:'招牌', emoji:'🪧', price:10, cat:'food', color:'#FFD54F' },
    { id:'table', name:'桌子', emoji:'🪑', price:15, cat:'food', color:'#8D6E63' },
    { id:'fruit', name:'水果', emoji:'🍎', price:5, cat:'food', color:'#E53935' },
    { id:'cake', name:'蛋糕', emoji:'🎂', price:18, cat:'food', color:'#F48FB1' },
    { id:'noodle', name:'面条', emoji:'🍜', price:8, cat:'food', color:'#FFB74D' },
    // 高楼
    { id:'building', name:'高楼', emoji:'🏢', price:40, cat:'city', color:'#78909C' },
    { id:'skyscraper', name:'摩天楼', emoji:'🏙️', price:80, cat:'city', color:'#546E7A' },
    { id:'road', name:'马路', emoji:'⬛', price:3, cat:'city', color:'#424242' },
    { id:'car', name:'汽车', emoji:'🚗', price:30, cat:'city', color:'#EF5350' },
    { id:'bus', name:'公交', emoji:'🚌', price:35, cat:'city', color:'#42A5F5' },
    { id:'light', name:'红绿灯', emoji:'🚦', price:20, cat:'city', color:'#66BB6A' },
    // 乡村
    { id:'farm', name:'农田', emoji:'🌾', price:10, cat:'rural', color:'#FBC02D' },
    { id:'windmill', name:'风车', emoji:'🌬️', price:35, cat:'rural', color:'#90CAF9' },
    { id:'well', name:'水井', emoji:'⛲', price:25, cat:'rural', color:'#4FC3F7' },
    { id:'hay', name:'稻草', emoji:'🌾', price:5, cat:'rural', color:'#FFD54F' },
    { id:'cow', name:'奶牛', emoji:'🐄', price:40, cat:'rural', color:'#F5F5F5' },
    { id:'chicken', name:'小鸡', emoji:'🐔', price:20, cat:'rural', color:'#FFD54F' },
    // 特殊
    { id:'star', name:'星星', emoji:'⭐', price:30, cat:'special', color:'#FFD700' },
    { id:'gem', name:'宝石', emoji:'💎', price:100, cat:'special', color:'#00BCD4' },
    { id:'rainbow', name:'彩虹', emoji:'🌈', price:50, cat:'special', color:'#FF6F00' },
    { id:'cloud', name:'云朵', emoji:'☁️', price:15, cat:'special', color:'#E1F5FE' },
    { id:'moon', name:'月亮', emoji:'🌙', price:40, cat:'special', color:'#FFF9C4' },
    { id:'sun', name:'太阳', emoji:'☀️', price:40, cat:'special', color:'#FFD600' },
    { id:'firework', name:'烟花', emoji:'🎆', price:35, cat:'special', color:'#FF4081' },
    { id:'balloon', name:'气球', emoji:'🎈', price:12, cat:'special', color:'#FF80AB' }
  ];

  // ============== V3 新增数据：乐园场景（6 种）==============
  var PARK_SCENES = [
    { id:'street', name:'乐园街道', icon:'road', bg:'linear-gradient(135deg,#667eea,#764ba2)', desc:'繁华的乐园街道', unlockCats:['basic','build','deco','city'] },
    { id:'city', name:'高楼大厦', icon:'building', bg:'linear-gradient(135deg,#4facfe,#00f2fe)', desc:'现代化的高楼大厦', unlockCats:['basic','build','city'] },
    { id:'cn', name:'国风庭院', icon:'tower', bg:'linear-gradient(135deg,#ff9a9e,#fad0c4)', desc:'古典国风庭院', unlockCats:['basic','build','cn'] },
    { id:'rural', name:'乡村风景', icon:'farm', bg:'linear-gradient(135deg,#a8edea,#fed6e3)', desc:'宁静的乡村风景', unlockCats:['basic','build','rural'] },
    { id:'food', name:'美食街道', icon:'shop', bg:'linear-gradient(135deg,#ffd89b,#19547b)', desc:'热闹的美食街道', unlockCats:['basic','build','food'] },
    { id:'free', name:'自由模式', icon:'star', bg:'linear-gradient(135deg,#a18cd1,#fbc2eb)', desc:'尽情发挥创意', unlockCats:['basic','build','deco','cn','food','city','rural','special'] }
  ];

  // ============== V3 新增数据：示例剧本（3 个）==============
  var SAMPLE_SCRIPTS = [
    {
      id:'s1', title:'魔法森林冒险', author:'叮咚小助手', emoji:'🌲',
      desc:'在魔法森林里寻找宝藏的冒险故事',
      reward: 50,
      scenes: [
        { id:0, bg:'森林入口', text:'你来到了魔法森林的入口，前方有两条路。左边传来流水声，右边有微光闪烁。', emoji:'🌲', choices:[
          { text:'走左边（溪流）', next:1 },
          { text:'走右边（微光）', next:2 }
        ]},
        { id:1, bg:'溪流边', text:'你发现了一条清澈的小溪，溪水里有闪闪发光的东西...', emoji:'💧', choices:[
          { text:'伸手去捞', next:3 },
          { text:'沿溪而上', next:4 }
        ]},
        { id:2, bg:'萤火虫林', text:'微光是萤火虫发出的！它们围着你飞舞，好像在指引方向。', emoji:'✨', choices:[
          { text:'跟着萤火虫走', next:5 },
          { text:'回到入口', next:0 }
        ]},
        { id:3, bg:'溪水中', text:'你捞到了一颗水晶宝石！但它沉甸甸的...', emoji:'💎', choices:[
          { text:'带走宝石', next:6 },
          { text:'放回水中', next:4 }
        ]},
        { id:4, bg:'瀑布前', text:'溪水尽头是一面瀑布，瀑布后隐约有一个洞穴。', emoji:'🌈', choices:[
          { text:'穿过瀑布', next:6 },
          { text:'返回', next:1 }
        ]},
        { id:5, bg:'古树下', text:'萤火虫带你来到一棵巨大的古树前，树上有一个树洞。', emoji:'🌳', choices:[
          { text:'钻进树洞', next:6 },
          { text:'在树下休息', next:0 }
        ]},
        { id:6, bg:'宝藏室', text:'你发现了宝藏！满满一箱金光闪闪的叮咚币！', emoji:'🏆', choices:[
          { text:'完美结局', next:-1 }
        ]}
      ],
      ending: '恭喜！你找到了魔法森林的宝藏！获得 50 叮咚币奖励！'
    },
    {
      id:'s2', title:'太空探险记', author:'叮咚小助手', emoji:'🚀',
      desc:'驾驶飞船探索神秘星球的科幻故事',
      reward: 60,
      scenes: [
        { id:0, bg:'太空舱', text:'你是一名宇航员，飞船接近了一颗未知的蓝色星球。警报响起：燃料即将耗尽！', emoji:'🚀', choices:[
          { text:'紧急降落蓝色星球', next:1 },
          { text:'呼叫太空站救援', next:2 }
        ]},
        { id:1, bg:'蓝色星球', text:'飞船降落在一片发光的森林边。这里的花会唱歌，树会发光。', emoji:'🌟', choices:[
          { text:'探索发光森林', next:3 },
          { text:'检查飞船损坏', next:4 }
        ]},
        { id:2, bg:'通讯频道', text:'太空站回复：救援队需要3小时到达，但你只能撑1小时。', emoji:'📡', choices:[
          { text:'冒险紧急降落', next:1 },
          { text:'尝试自己修飞船', next:4 }
        ]},
        { id:3, bg:'歌唱森林', text:'森林深处有一个水晶洞，洞里有一块巨大的能量晶体！', emoji:'💎', choices:[
          { text:'取走能量晶体', next:5 },
          { text:'小心观察不碰', next:6 }
        ]},
        { id:4, bg:'飞船旁', text:'你检查飞船，发现引擎只是卡住了一块石头。', emoji:'🔧', choices:[
          { text:'搬开石头修好飞船', next:5 },
          { text:'去森林找能源', next:3 }
        ]},
        { id:5, bg:'起飞时刻', text:'飞船修好了！能量晶体足够飞回地球。你带着外星晶体凯旋归来。', emoji:'🌍', choices:[
          { text:'英雄归来', next:-1 }
        ]},
        { id:6, bg:'水晶洞', text:'你静静观察，一只友好的外星小生物走出来，送给你一块能量石。', emoji:'👽', choices:[
          { text:'感谢外星朋友', next:5 },
          { text:'继续探索', next:3 }
        ]}
      ],
      ending: '太棒了！你成功完成了太空探险，带回了珍贵的外星能量晶体！获得 60 叮咚币奖励！'
    },
    {
      id:'s3', title:'海底寻宝之旅', author:'叮咚小助手', emoji:'🐠',
      desc:'潜入海底寻找沉船宝藏的冒险故事',
      reward: 55,
      scenes: [
        { id:0, bg:'海边码头', text:'你得到一张藏宝图，图上标记着一艘沉船的位置。你站在码头前，准备出发。', emoji:'🗺️', choices:[
          { text:'独自潜水出发', next:1 },
          { text:'雇一位老船长', next:2 }
        ]},
        { id:1, bg:'海面', text:'你独自潜入海中，遇到一群友善的海豚。它们似乎想带你去某个地方。', emoji:'🐬', choices:[
          { text:'跟随海豚', next:3 },
          { text:'按藏宝图走', next:4 }
        ]},
        { id:2, bg:'老船长船上', text:'老船长告诉你：那片海域有漩涡，需要从侧面绕过去。', emoji:'⚓', choices:[
          { text:'听船长的话绕路', next:4 },
          { text:'冒险直穿漩涡', next:5 }
        ]},
        { id:3, bg:'海豚湾', text:'海豚带你来到一个海底珊瑚洞，洞里有一把生锈的钥匙。', emoji:'🗝️', choices:[
          { text:'捡起钥匙', next:6 },
          { text:'继续找沉船', next:4 }
        ]},
        { id:4, bg:'沉船处', text:'你找到了沉船！船舱上有一把大锁，需要钥匙才能打开。', emoji:'🚢', choices:[
          { text:'用力砸开锁', next:5 },
          { text:'回去找钥匙', next:3 }
        ]},
        { id:5, bg:'漩涡中', text:'漩涡把你卷入海底深处，却意外发现了沉船的另一个入口。', emoji:'🌀', choices:[
          { text:'进入沉船', next:6 },
          { text:'浮出水面', next:0 }
        ]},
        { id:6, bg:'宝藏舱', text:'你打开了宝藏舱！里面满满的金币和一颗发光的珍珠。', emoji:'💎', choices:[
          { text:'满载而归', next:-1 }
        ]}
      ],
      ending: '太厉害了！你找到了海底沉船的宝藏！获得 55 叮咚币奖励！'
    }
  ];

  // ============== V3 新增数据：头像框（10 款）==============
  var AVATAR_FRAMES = [
    { id:'none', name:'无框', price:0, css:'none' },
    { id:'gold', name:'金色皇冠', price:200, css:'0 0 0 3px #FFD700, 0 0 12px rgba(255,215,0,0.6)' },
    { id:'silver', name:'银色月光', price:150, css:'0 0 0 3px #C0C0C0, 0 0 12px rgba(192,192,192,0.6)' },
    { id:'fire', name:'火焰光环', price:300, css:'0 0 0 3px #FF6B35, 0 0 16px rgba(255,107,53,0.7)' },
    { id:'rainbow', name:'彩虹之环', price:500, css:'0 0 0 3px #FF6F00, 0 0 16px rgba(255,111,0,0.5)' },
    { id:'ice', name:'冰晶之框', price:250, css:'0 0 0 3px #4FC3F7, 0 0 14px rgba(79,195,247,0.7)' },
    { id:'leaf', name:'翠叶之环', price:180, css:'0 0 0 3px #66BB6A, 0 0 12px rgba(102,187,106,0.6)' },
    { id:'star', name:'星辰之框', price:400, css:'0 0 0 3px #7C4DFF, 0 0 16px rgba(124,77,255,0.6)' },
    { id:'heart', name:'爱心之环', price:220, css:'0 0 0 3px #EC407A, 0 0 14px rgba(236,64,122,0.6)' },
    { id:'crown', name:'王者之冠', price:800, css:'0 0 0 4px #FFD700, 0 0 20px rgba(255,215,0,0.8)' }
  ];

  // ============== V3 新增数据：主题（8 款）==============
  var THEMES = [
    { id:'glass', name:'毛玻璃', price:0, primary:'#7C5CFF', bg:'#FAF8FF', dark:'#1A1726' },
    { id:'night', name:'暗夜', price:100, primary:'#5C6BC0', bg:'#1A1A2E', dark:'#0D0D1A' },
    { id:'cn', name:'国风', price:150, primary:'#C62828', bg:'#FFF8E1', dark:'#3E2723' },
    { id:'cyber', name:'赛博', price:200, primary:'#00BCD4', bg:'#0A0E27', dark:'#050816' },
    { id:'candy', name:'糖果', price:120, primary:'#FF6B9D', bg:'#FFF0F5', dark:'#2D1B2E' },
    { id:'forest', name:'森林', price:120, primary:'#43A047', bg:'#F1F8E9', dark:'#1B2E1A' },
    { id:'ocean', name:'海洋', price:130, primary:'#0288D1', bg:'#E1F5FE', dark:'#0A1929' },
    { id:'galaxy', name:'星空', price:250, primary:'#7B1FA2', bg:'#1A0033', dark:'#0A001A' }
  ];

  // ============== V3 新增数据：壁纸（12 种）==============
  var WALLPAPERS = [
    // 渐变壁纸
    { id:'grad-sunset', name:'日落', type:'gradient', value:'linear-gradient(135deg,#ff9a9e,#fad0c4,#fbc2eb)', price:0 },
    { id:'grad-ocean', name:'海洋', type:'gradient', value:'linear-gradient(135deg,#667eea,#764ba2)', price:0 },
    { id:'grad-forest', name:'森林', type:'gradient', value:'linear-gradient(135deg,#a8edea,#fed6e3)', price:0 },
    { id:'grad-candy', name:'糖果', type:'gradient', value:'linear-gradient(135deg,#fbc2eb,#a6c1ee)', price:0 },
    { id:'grad-fire', name:'烈焰', type:'gradient', value:'linear-gradient(135deg,#f5af19,#f12711)', price:50 },
    { id:'grad-aurora', name:'极光', type:'gradient', value:'linear-gradient(135deg,#43e97b,#38f9d7,#4facfe)', price:80 },
    { id:'grad-galaxy', name:'星河', type:'gradient', value:'linear-gradient(135deg,#0c0c1d,#1a1a3e,#2d1b69)', price:100 },
    { id:'grad-peach', name:'蜜桃', type:'gradient', value:'linear-gradient(135deg,#ffecd2,#fcb69f)', price:50 },
    { id:'grad-mint', name:'薄荷', type:'gradient', value:'linear-gradient(135deg,#c1dfc4,#deecdd)', price:50 },
    { id:'grad-lavender', name:'薰衣草', type:'gradient', value:'linear-gradient(135deg,#c3cfe2,#f5f7fa)', price:50 },
    // 每日必应
    { id:'bing-daily', name:'每日必应', type:'bing', value:'', price:0 },
    // 自定义图片
    { id:'custom', name:'自定义图片', type:'custom', value:'', price:0 }
  ];

  // ============== V3 新增数据：界面风格（3 种）==============
  var UI_STYLES = [
    { id:'fluent', name:'Fluent 风格', desc:'微软 Fluent Design，毛玻璃+圆角+阴影', price:0, previewBg:'linear-gradient(135deg,rgba(255,255,255,0.65),rgba(124,92,255,0.15))' },
    { id:'gradient', name:'渐变风格', desc:'大胆渐变+发光边框+霓虹', price:100, previewBg:'linear-gradient(135deg,#7C5CFF,#FF6B9D)' },
    { id:'trendy', name:'潮流风格', desc:'Glassmorphism+黏土+3D阴影', price:150, previewBg:'linear-gradient(135deg,rgba(255,255,255,0.25),rgba(0,0,0,0.08))' }
  ];

  /** 暴露到 window */
  window.DD = {
    GRADES: GRADES,
    VERSIONS: VERSIONS,
    SUBJECTS: SUBJECTS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    TITLES: TITLES,
    LEVELS: LEVELS,
    QUESTIONS: QUESTIONS,
    DICT: DICT,
    ARTICLES: ARTICLES,
    EVENTS: EVENTS,
    PRESET_AVATARS: PRESET_AVATARS,
    makeMapNodes: makeMapNodes,
    makeDailyTasks: makeDailyTasks,
    calcLevel: calcLevel,
    nextLevelExp: nextLevelExp,
    findSubject: findSubject,
    // ===== V3 新增数据 =====
    TEXTBOOKS: TEXTBOOKS,
    MATERIALS: MATERIALS,
    PARK_SCENES: PARK_SCENES,
    SAMPLE_SCRIPTS: SAMPLE_SCRIPTS,
    AVATAR_FRAMES: AVATAR_FRAMES,
    THEMES: THEMES,
    WALLPAPERS: WALLPAPERS,
    UI_STYLES: UI_STYLES
  };
})(window);
