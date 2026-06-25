// ============================================================
// 教学模板库 — 双风格讲解生成
// 常规讲解：结构化、正式、含公式
// 故事化讲解：生活类比、角色对话、口诀技巧（"讲给 Alice 听"风格）
// ============================================================

(function() {
'use strict';

// ===== 类比库 =====
// 按学科 + 关键词匹配，为知识点选择合适的生活类比
var ANALOGY_LIBRARY = {
  math: [
    { keywords: ['分数', '分母', '分子', '约分', '通分'], analogy: '分披萨', scene: '把一个大披萨平均切成几块，每个人拿不同的份数',
      metaphor: '分子是你吃了多少块，分母是一共切了多少块，分数线就是那把切披萨的刀' },
    { keywords: ['小数', '小数点'], analogy: '元角分', scene: '去超市买东西时的钱币',
      metaphor: '整数部分是"元"，小数点后第一位是"角"，第二位是"分"' },
    { keywords: ['负数', '正负'], analogy: '温度计', scene: '冬天的气温和夏天的气温',
      metaphor: '0℃ 是分界线，零上是正数，零下是负数' },
    { keywords: ['方程'], analogy: '天平', scene: '实验室里的天平称重',
      metaphor: '等号就像天平的支点，左边和右边必须一样重' },
    { keywords: ['面积'], analogy: '铺地砖', scene: '给房间地面铺瓷砖',
      metaphor: '面积就是地面能铺多少块砖，长乘宽就是砖的排数乘列数' },
    { keywords: ['体积', '容积'], analogy: '装水杯', scene: '往杯子里倒水',
      metaphor: '体积就是杯子能装多少水，长乘宽乘高就是水的长宽深' },
    { keywords: ['比例', '比'], analogy: '调果汁', scene: '冲一杯浓缩果汁',
      metaphor: '浓缩汁和水的比例就是"配方"，1:4 就是 1 份汁配 4 份水' },
    { keywords: ['百分数', '百分比'], analogy: '考试分数', scene: '考试 100 分满分',
      metaphor: '百分数就是"100 分里拿了多少分"，85% 就是 100 分考了 85 分' },
    { keywords: ['统计', '平均', '中位数'], analogy: '班级成绩', scene: '全班考试后的成绩统计',
      metaphor: '平均分就是把所有人的分数加起来再平分，中位数就是排在最中间那个人的分数' },
    { keywords: ['角', '角度'], analogy: '折纸扇', scene: '打开和合上纸扇',
      metaphor: '角就是纸扇打开的开口大小，角度越大开口越大' },
    { keywords: ['三角形'], analogy: '搭帐篷', scene: '用支架搭一个三角形帐篷',
      metaphor: '三角形是最稳定的形状，三根支架一搭就不会变形' },
    { keywords: ['长方形', '正方形'], analogy: '课桌面', scene: '教室里的课桌',
      metaphor: '课桌面就是一个长方形，有四条边、四个直角' },
    { keywords: ['圆'], analogy: '披萨饼', scene: '一个圆圆的披萨',
      metaphor: '圆心是披萨的正中心，半径是从中心到边缘的距离' },
    { keywords: ['整数', '自然数'], analogy: '数苹果', scene: '篮子里的苹果',
      metaphor: '整数就像数篮子里的苹果，一个一个往上加' },
    { keywords: ['乘法'], analogy: '排队列', scene: '同学们排队做操',
      metaphor: '乘法就是排队，3 排每排 4 人就是 3×4=12 人' },
    { keywords: ['除法'], analogy: '分糖果', scene: '把一袋糖果分给几个小朋友',
      metaphor: '除法就是平均分糖果，12 颗糖分给 3 个人，每人 4 颗' },
    { keywords: ['加法'], analogy: '攒零花钱', scene: '每天攒一点零花钱',
      metaphor: '加法就像攒钱，今天 5 元明天 3 元，加在一起就是 8 元' },
    { keywords: ['减法'], analogy: '花钱买东西', scene: '用零花钱买零食',
      metaphor: '减法就像花钱，有 10 元花了 3 元，还剩 7 元' },
    { keywords: ['字母', '代数', '未知数'], analogy: '盲盒', scene: '一个不知道里面装了什么的盲盒',
      metaphor: '字母就像盲盒，用 x 表示里面不知道的数，等解开才知道' },
    { keywords: ['对称'], analogy: '蝴蝶翅膀', scene: '一只蝴蝶展开翅膀',
      metaphor: '对称就像蝴蝶的左右翅膀，对折后两边完全重合' },
    { keywords: ['质数', '合数'], analogy: '积木拼搭', scene: '用小积木拼大积木',
      metaphor: '质数是只能拼成一条直线的积木，合数是能拼成矩形的积木' },
    { keywords: ['倍数', '因数'], analogy: '打包快递', scene: '把东西打包成箱',
      metaphor: '因数是能整箱装下的包装方式，倍数是装好几箱后的总数' },
  ],
  chinese: [
    { keywords: ['修辞', '比喻', '拟人'], analogy: '画画', scene: '用文字给读者画一幅画',
      metaphor: '比喻就像给文字加了滤镜，拟人就是让东西像人一样会说话' },
    { keywords: ['句型', '句式'], analogy: '搭积木', scene: '用不同形状的积木搭句子',
      metaphor: '句型就是句子的骨架结构，换一种句型就像换一种搭法' },
    { keywords: ['阅读', '理解'], analogy: '看电影', scene: '看一部精彩的电影',
      metaphor: '阅读就像看电影，要理解剧情、感受人物、体会主题' },
    { keywords: ['作文', '写作'], analogy: '做菜', scene: '在厨房做一道菜',
      metaphor: '写作文就像做菜，素材是食材，结构是菜谱，修辞是调味料' },
    { keywords: ['古诗', '诗词'], analogy: '看风景画', scene: '欣赏一幅山水画',
      metaphor: '古诗就像一幅风景画，短短几句就能画出整个场景' },
    { keywords: ['字词', '词语'], analogy: '调色盘', scene: '画画时的调色盘',
      metaphor: '词语就像调色盘上的颜色，选对词就像选对颜色' },
    { keywords: ['标点'], analogy: '红绿灯', scene: '马路上的交通信号灯',
      metaphor: '标点符号就是句子的红绿灯，告诉读者在哪里停、在哪里转弯' },
    { keywords: ['段落', '结构'], analogy: '盖房子', scene: '一栋有几层楼的房子',
      metaphor: '段落结构就像房子的楼层，一层一层往上盖' },
  ],
  english: [
    { keywords: ['时态', '现在', '过去', '将来'], analogy: '时间轴', scene: '一条画着过去、现在、将来的时间线',
      metaphor: '时态就像时间轴上的指针，指向什么时候发生的事' },
    { keywords: ['语法', '句型'], analogy: '交通规则', scene: '马路上的交通规则',
      metaphor: '语法就是英语的交通规则，按规则走才不会"撞车"' },
    { keywords: ['词汇', '单词'], analogy: '积木块', scene: '一盒不同形状的积木',
      metaphor: '单词就像积木块，越多越能搭出复杂的句子' },
    { keywords: ['阅读', '理解'], analogy: '侦探破案', scene: '侦探在寻找线索',
      metaphor: '阅读理解就像当侦探，从字里行间找线索推出答案' },
    { keywords: ['听力'], analogy: '听广播', scene: '听收音机里的节目',
      metaphor: '听力就像听广播，抓住关键词就能理解大意' },
    { keywords: ['写作', '作文'], analogy: '搭乐高', scene: '用乐高积木拼一个作品',
      metaphor: '英语写作就像搭乐高，用单词积木按语法图纸拼出文章' },
    { keywords: ['发音', '音标'], analogy: '学唱歌', scene: '跟着音乐学唱一首歌',
      metaphor: '音标就像乐谱，学会了就能"唱"出正确的英语' },
  ],
  science: [
    { keywords: ['光', '影子'], analogy: '手电筒', scene: '黑暗中打开手电筒',
      metaphor: '光就像手电筒照出的光束，遇到东西就被挡住形成影子' },
    { keywords: ['电', '电路'], analogy: '水管', scene: '家里的水管系统',
      metaphor: '电线就像水管，电流就像水流，开关就像水龙头' },
    { keywords: ['力', '运动'], analogy: '推购物车', scene: '在超市推购物车',
      metaphor: '力就像推购物车的力气，用力越大车跑得越快' },
    { keywords: ['声音'], analogy: '打电话', scene: '和朋友打电话',
      metaphor: '声音传播就像打电话，从一端传到另一端' },
    { keywords: ['热', '温度'], analogy: '暖手宝', scene: '冬天用的暖手宝',
      metaphor: '热量就像暖手宝的热气，从热的地方传到冷的地方' },
    { keywords: ['植物', '叶子', '花'], analogy: '小工厂', scene: '一个运转中的小工厂',
      metaphor: '植物的叶子就像小工厂，用阳光和二氧化碳"生产"养分' },
    { keywords: ['动物', '分类'], analogy: '整理衣柜', scene: '把衣服按类型整理到衣柜',
      metaphor: '动物分类就像整理衣柜，按特征分门别类' },
    { keywords: ['地球', '太阳', '月亮'], analogy: '旋转木马', scene: '游乐园的旋转木马',
      metaphor: '地球绕太阳转就像旋转木马，月亮又绕着地球转' },
    { keywords: ['水', '循环'], analogy: '晒衣服', scene: '洗完衣服晾晒的过程',
      metaphor: '水循环就像晒衣服，水蒸发上天又变成雨落下来' },
  ],
  physics: [
    { keywords: ['力', '牛顿'], analogy: '推门', scene: '用力推一扇门',
      metaphor: '力就像推门的力气，力越大门开得越快' },
    { keywords: ['电', '电流'], analogy: '水流', scene: '河里流动的水',
      metaphor: '电流就像水流，电压就像水压，电阻就像河道里的石头' },
    { keywords: ['光', '反射', '折射'], analogy: '照镜子', scene: '对着镜子看自己',
      metaphor: '光的反射就像照镜子，折射就像把筷子插进水里看起来弯了' },
    { keywords: ['热', '能量'], analogy: '充电宝', scene: '手机充电宝储电',
      metaphor: '能量就像充电宝里的电，可以储存、转换和使用' },
    { keywords: ['运动', '速度'], analogy: '跑步比赛', scene: '操场的跑步比赛',
      metaphor: '速度就像跑步的快慢，加速度就像起跑时越来越快' },
  ],
  chemistry: [
    { keywords: ['原子', '分子'], analogy: '乐高积木', scene: '用乐高积木拼各种东西',
      metaphor: '原子就像最小的乐高积木，分子是用积木拼出来的作品' },
    { keywords: ['反应', '化学'], analogy: '烘焙蛋糕', scene: '在厨房烤蛋糕',
      metaphor: '化学反应就像烤蛋糕，把原料混合加热后变成了全新的东西' },
    { keywords: ['元素', '周期表'], analogy: '通讯录', scene: '手机里的联系人列表',
      metaphor: '元素周期表就像元素的通讯录，按规律排列方便查找' },
    { keywords: ['酸', '碱'], analogy: '调味料', scene: '厨房里的醋和小苏打',
      metaphor: '酸就像醋一样酸溜溜的，碱就像小苏打一样涩涩的' },
  ],
  biology: [
    { keywords: ['细胞'], analogy: '小房间', scene: '一个功能齐全的小房间',
      metaphor: '细胞就像身体里的小房间，每个房间有不同功能' },
    { keywords: ['基因', '遗传'], analogy: '说明书', scene: '一本产品说明书',
      metaphor: '基因就像身体的说明书，决定了你的各种特征' },
    { keywords: ['生态', '环境'], analogy: '社区', scene: '一个生活社区',
      metaphor: '生态系统就像一个社区，各种生物互相依存' },
    { keywords: ['人体', '器官'], analogy: '工厂车间', scene: '一个大型工厂的不同车间',
      metaphor: '人体器官就像工厂的车间，各司其职又互相配合' },
  ],
  history: [
    { keywords: ['朝代', '皇帝'], analogy: '接力赛', scene: '一棒接一棒的接力赛跑',
      metaphor: '朝代更替就像接力赛，一棒接一棒往下传' },
    { keywords: ['战争', '战役'], analogy: '下棋', scene: '两个人下棋对弈',
      metaphor: '战争就像下棋，比的是策略、布局和时机' },
    { keywords: ['文化', '思想'], analogy: '种子', scene: '播下一颗种子慢慢长大',
      metaphor: '思想文化就像种子，播下后慢慢生根发芽影响后世' },
    { keywords: ['改革', '变法'], analogy: '装修房子', scene: '把旧房子重新装修',
      metaphor: '改革就像装修房子，把旧的不好用的换掉换成新的' },
  ],
  morality_law: [
    { keywords: ['法律', '规则'], analogy: '游戏规则', scene: '玩游戏时的规则',
      metaphor: '法律就像游戏规则，大家都遵守才能玩得好' },
    { keywords: ['道德', '品德'], analogy: '内心尺子', scene: '心里的一把尺子',
      metaphor: '道德就像心里的尺子，量一量该不该做某件事' },
    { keywords: ['权利', '义务'], analogy: '合同', scene: '签一份双方协议',
      metaphor: '权利和义务就像合同的两面，享受权利也要履行义务' },
    { keywords: ['宪法'], analogy: '总说明书', scene: '一本产品的总说明书',
      metaphor: '宪法就像国家的总说明书，是所有法律的"老大"' },
  ]
};

// 通用类比（兜底）
var GENERIC_ANALOGY = {
  analogy: '生活中的小发现',
  scene: '日常生活中的一次小发现',
  metaphor: '每个知识点都来自生活，理解了生活就能理解知识'
};

// ===== 查找类比 =====
function findAnalogy(kp) {
  var subject = kp.subject || 'math';
  var library = ANALOGY_LIBRARY[subject] || [];
  var name = kp.name || '';

  for (var i = 0; i < library.length; i++) {
    var entry = library[i];
    for (var j = 0; j < entry.keywords.length; j++) {
      if (name.indexOf(entry.keywords[j]) !== -1) {
        return entry;
      }
    }
  }

  // 如果是自定义知识点，尝试在所有学科中查找
  if (kp.custom) {
    for (var subj in ANALOGY_LIBRARY) {
      var lib = ANALOGY_LIBRARY[subj];
      for (var k = 0; k < lib.length; k++) {
        for (var m = 0; m < lib[k].keywords.length; m++) {
          if (name.indexOf(lib[k].keywords[m]) !== -1) {
            return lib[k];
          }
        }
      }
    }
  }

  return GENERIC_ANALOGY;
}

// ===== 判断知识类型 =====
function detectType(kp) {
  var name = (kp.name || '').toLowerCase();
  if (name.indexOf('计算') !== -1 || name.indexOf('运算') !== -1 || name.indexOf('加减') !== -1 ||
      name.indexOf('乘除') !== -1 || name.indexOf('乘法') !== -1 || name.indexOf('除法') !== -1) {
    return 'calculation';
  }
  if (name.indexOf('公式') !== -1 || name.indexOf('法则') !== -1 || name.indexOf('性质') !== -1) {
    return 'rule';
  }
  return 'concept';
}

// ===== 生成常规讲解 =====
function generateRegular(kp) {
  var html = '';
  var subSkills = kp.sub_skills || [];
  var type = detectType(kp);

  // 导语
  html += '<h3>一、什么是' + escapeHtml(kp.name) + '</h3>';
  html += '<p>' + generateIntro(kp) + '</p>';

  // 子技能展开
  if (subSkills.length > 0) {
    html += '<h3>二、核心要点</h3>';
    html += '<ol>';
    for (var i = 0; i < subSkills.length; i++) {
      html += '<li><strong>' + escapeHtml(subSkills[i]) + '</strong>：' +
              generateSkillExplanation(subSkills[i], kp) + '</li>';
    }
    html += '</ol>';
  } else {
    html += '<h3>二、核心要点</h3>';
    html += '<p>' + generateGenericExplanation(kp) + '</p>';
  }

  // 公式/法则（如果是计算类或规则类）
  if (type === 'calculation' || type === 'rule') {
    html += '<h3>三、方法与公式</h3>';
    html += generateFormulaBlock(kp);
  }

  // 要点提示
  html += '<h3>' + (type === 'calculation' || type === 'rule' ? '四' : '三') + '、注意事项</h3>';
  html += generateRegularNotes(kp);

  return html;
}

// 生成导语
function generateIntro(kp) {
  var name = kp.name;
  var subject = kp.subject_name || '';
  var module = kp.module || '';
  var unit = kp.unit || '';

  var intros = [
    name + '是' + (subject || '学习') + '中' + (module ? module + '模块下' : '') + '的重要知识点' +
      (unit ? '，属于"' + unit + '"单元' : '') + '。下面我们从多个角度来系统地学习这个知识点。',
    '在本节中，我们将学习' + name + '。' + (module ? '它是' + module + '部分的核心内容之一。' : '') +
      '掌握这个知识点，有助于后续更复杂内容的学习。',
    name + '是一个关键的学习内容' + (grade ? '，适合' + grade + '阶段学习' : '') + '。' +
      '我们将通过定义、要点、方法和注意事项来全面掌握它。',
  ];

  var grade = kp.grade || kp.phase_name || '';
  return intros[Math.floor(Math.random() * intros.length)];
}

// 生成子技能解释
function generateSkillExplanation(skill, kp) {
  // 根据子技能名称的模式生成解释
  if (skill.indexOf('理解') === 0) {
    var rest = skill.substring(2);
    return '首先要理解' + rest + '的含义。这是掌握本知识点的基础，只有真正理解了概念，才能灵活运用。';
  }
  if (skill.indexOf('掌握') === 0) {
    var rest2 = skill.substring(2);
    return '需要熟练掌握' + rest2 + '。通过反复练习，做到能够准确、快速地运用。';
  }
  if (skill.indexOf('用') === 0 && skill.indexOf('表示') !== -1) {
    return '学会' + skill + '，这是将抽象概念转化为具体表达的关键能力。';
  }
  if (skill.indexOf('确定') === 0) {
    return skill + '是解题的关键步骤，需要根据规则准确判断。';
  }
  if (skill.indexOf('计算') !== -1 || skill.indexOf('求') === 0) {
    return skill + '时，要注意步骤的准确性和规范性，按照法则一步步操作。';
  }
  if (skill.indexOf('区分') !== -1 || skill.indexOf('辨别') !== -1 || skill.indexOf('比较') !== -1) {
    return skill + '时，要抓住关键特征，通过对比来加深理解。';
  }
  if (skill.indexOf('应用') !== -1 || skill.indexOf('解决') !== -1) {
    return skill + '是学习的最终目标，要将所学知识灵活运用到实际问题中。';
  }
  // 默认
  return skill + '是本知识点的重要组成部分，需要认真学习和掌握。';
}

// 生成通用解释（无子技能时）
function generateGenericExplanation(kp) {
  var name = kp.name;
  return name + '是本单元的重要学习内容。建议通过理解定义、掌握方法、练习例题三个步骤来学习。' +
         '先弄清楚"' + name + '"是什么，再学习如何运用，最后通过练习巩固。';
}

// 生成公式块
function generateFormulaBlock(kp) {
  var name = kp.name || '';
  var html = '';

  if (name.indexOf('加法') !== -1 || name.indexOf('加') !== -1) {
    html += '<div class="formula-block">$$ a + b = \\text{结果} $$</div>';
    html += '<p>加法运算的关键是对齐数位，从低位到高位依次相加，注意进位。</p>';
  } else if (name.indexOf('减法') !== -1 || name.indexOf('减') !== -1) {
    html += '<div class="formula-block">$$ a - b = \\text{结果} \\quad (a \\geq b) $$</div>';
    html += '<p>减法运算要注意借位，从低位到高位依次相减。</p>';
  } else if (name.indexOf('乘法') !== -1 || name.indexOf('乘') !== -1) {
    html += '<div class="formula-block">$$ a \\times b = \\text{结果} $$</div>';
    html += '<p>乘法运算要熟记乘法口诀，注意积的位数和对齐。</p>';
  } else if (name.indexOf('除法') !== -1 || name.indexOf('除') !== -1) {
    html += '<div class="formula-block">$$ a \\div b = \\text{结果} \\quad (b \\neq 0) $$</div>';
    html += '<p>除法运算要确定商的位置，注意余数要比除数小。</p>';
  } else if (name.indexOf('面积') !== -1) {
    html += '<div class="formula-block">$$ S = a \\times b \\quad \\text{（长方形面积）} $$</div>';
    html += '<p>面积的计算要先确定图形形状，再选择对应的公式。</p>';
  } else if (name.indexOf('体积') !== -1) {
    html += '<div class="formula-block">$$ V = a \\times b \\times h \\quad \\text{（长方体体积）} $$</div>';
    html += '<p>体积的计算要注意单位统一，长宽高要用相同单位。</p>';
  } else {
    html += '<div class="formula-block">$$ \\text{掌握核心公式和法则是解题的关键} $$</div>';
    html += '<p>建议在学习过程中整理属于自己的公式卡片，方便复习。</p>';
  }

  return html;
}

// 生成常规讲解注意事项
function generateRegularNotes(kp) {
  var errors = kp.common_errors || [];
  var html = '<ul>';

  if (errors.length > 0) {
    for (var i = 0; i < errors.length; i++) {
      html += '<li>' + escapeHtml(errors[i]) + '</li>';
    }
  } else {
    html += '<li>注意理解概念的本质，不要死记硬背</li>';
    html += '<li>做题时要仔细审题，看清题目要求</li>';
    html += '<li>计算过程中注意检查每一步的正确性</li>';
    html += '<li>结果要化简或按要求格式作答</li>';
  }

  html += '</ul>';
  return html;
}

// ===== 生成故事化讲解 =====
function generateStory(kp) {
  var html = '';
  var analogy = findAnalogy(kp);
  var subSkills = kp.sub_skills || [];
  var name = kp.name;

  // 开场：用类比引入
  html += '<h3>' + getEmoji(kp) + ' ' + escapeHtml(name) + ' —— ' + escapeHtml(analogy.analogy) + '的故事</h3>';
  html += '<div class="speech-bubble">';
  html += 'Alice，让我们来认识一下<strong>' + escapeHtml(name) + '</strong>。';
  html += '想象一下' + analogy.scene + '——' + analogy.metaphor + '。';
  html += '是不是一下子就亲切了？';
  html += '</div>';

  // 用类比解释子技能
  if (subSkills.length > 0) {
    html += '<h3>🎯 拆开来看，其实很简单</h3>';
    for (var i = 0; i < subSkills.length; i++) {
      html += '<div class="speech-bubble">';
      html += '<strong>第' + (i + 1) + '步：' + escapeHtml(subSkills[i]) + '</strong><br>';
      html += generateStoryExplanation(subSkills[i], analogy, kp);
      html += '</div>';
    }
  } else {
    html += '<h3>🎯 换个角度理解</h3>';
    html += '<div class="speech-bubble">';
    html += '把' + escapeHtml(name) + '想象成' + analogy.scene + '。';
    html += analogy.metaphor + '。';
    html += '理解了这个类比，' + escapeHtml(name) + '的核心就抓住了！';
    html += '</div>';
  }

  // 举例
  html += generateStoryExample(kp, analogy);

  // 小技巧
  html += '<div class="example-box">';
  html += '<div class="label">🧠 小技巧：</div>';
  html += generateStoryTip(kp);
  html += '</div>';

  // 常见陷阱
  var errors = kp.common_errors || [];
  if (errors.length > 0) {
    html += '<div class="example-box">';
    html += '<div class="label">⚠️ 小心这些坑：</div>';
    html += '<ul>';
    for (var j = 0; j < Math.min(errors.length, 3); j++) {
      html += '<li>' + escapeHtml(errors[j]) + '</li>';
    }
    html += '</ul>';
    html += '</div>';
  }

  return html;
}

// 生成故事化解释
function generateStoryExplanation(skill, analogy, kp) {
  if (skill.indexOf('理解') === 0) {
    var rest = skill.substring(2);
    return '先搞懂"' + rest + '"是什么意思。用' + analogy.analogy + '来说的话，就是' +
           '先弄清楚规则怎么玩，才能开始游戏。';
  }
  if (skill.indexOf('掌握') === 0) {
    var rest2 = skill.substring(2);
    return '然后要学会"' + rest2 + '"。就像玩' + analogy.analogy + '，知道了规则还不够，' +
           '得多练几次才能玩得好！';
  }
  if (skill.indexOf('确定') === 0) {
    return '这一步要' + skill + '。就像在' + analogy.scene + '里找到关键信息，' +
           '找准了才能继续往下走。';
  }
  if (skill.indexOf('计算') !== -1 || skill.indexOf('求') === 0) {
    return '接下来是' + skill + '。别怕，就像在' + analogy.scene + '里一步步操作，' +
           '按顺序来就不会出错！';
  }
  if (skill.indexOf('区分') !== -1 || skill.indexOf('辨别') !== -1) {
    return '要学会' + skill + '。就像区分不同的' + analogy.analogy + '，' +
           '抓住最明显的特征就能一眼认出来！';
  }
  if (skill.indexOf('应用') !== -1 || skill.indexOf('解决') !== -1) {
    return '最后是' + skill + '。这是最厉害的一步——把学到的本领用到实际问题中，' +
           '就像成了' + analogy.analogy + '的高手！';
  }
  if (skill.indexOf('用') === 0) {
    return '学会' + skill + '。就像学会了用' + analogy.analogy + '的新玩法，' +
           '你的"技能包"又多了一个！';
  }
  return skill + '。记住，每个小步骤都是通向成功的阶梯，一步一步来，你一定行！';
}

// 生成故事化举例
function generateStoryExample(kp, analogy) {
  var examples = kp.typical_examples || [];
  var html = '';

  if (examples.length > 0) {
    var ex = examples[0];
    html += '<div class="example-box">';
    html += '<div class="label">📝 来个例子：</div>';
    html += '<strong>题目：</strong>' + escapeHtml(ex.question || '') + '<br>';
    html += '<strong>答案：</strong>' + escapeHtml(ex.answer || '');
    if (ex.tests) {
      html += '<br><span style="font-size:12px;color:var(--text-muted);">（考查：' + escapeHtml(ex.tests) + '）</span>';
    }
    html += '</div>';
  } else {
    html += '<div class="example-box">';
    html += '<div class="label">📝 来个例子：</div>';
    html += '试着找一个生活中的' + escapeHtml(analogy.analogy) + '的例子，' +
            '想想它和' + escapeHtml(kp.name) + '有什么关系。' +
            '把生活经验和知识联系起来，学习就会变得很有趣！';
    html += '</div>';
  }

  return html;
}

// 生成故事化小技巧
function generateStoryTip(kp) {
  var name = kp.name || '';
  var tips = [
    '把"' + name + '"想象成一个故事，每个步骤都是剧情的一部分，记住了故事就记住了知识！',
    '学完之后，试着用自己的话给爸爸妈妈讲一遍"' + name + '"。能讲清楚，说明你真的懂了！',
    '做个"知识卡片"，一面写知识点名称，一面写关键要点，随时翻看，越记越牢！',
    '遇到不会的题别着急，先想想今天学的"' + name + '"，看看能不能用上。',
    '把容易错的地方用红笔标出来，下次复习时一眼就能看到"雷区"！',
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

// 获取知识点 emoji
function getEmoji(kp) {
  var subject = kp.subject || '';
  var emojis = {
    math: '🔢', chinese: '📖', english: '🔤', science: '🔬',
    physics: '⚡', chemistry: '🧪', biology: '🧬', history: '📜', morality_law: '⚖️'
  };
  return emojis[subject] || '💡';
}

// ===== 生成常见错误模块 =====
function generateErrors(kp) {
  var errors = kp.common_errors || [];
  var html = '';

  if (errors.length === 0) {
    html += '<div class="empty-notice">该知识点暂无常见错误数据。<br>建议在学习时自行整理易错点，形成自己的"避坑指南"。</div>';
    return html;
  }

  html += '<p>以下是学习<strong>' + escapeHtml(kp.name) + '</strong>时最常见的错误表现，提前了解可以帮助你避免踩坑：</p>';
  html += '<ul class="error-list">';
  for (var i = 0; i < errors.length; i++) {
    html += '<li>' + escapeHtml(errors[i]) + '</li>';
  }
  html += '</ul>';

  // 添加建议
  html += '<div class="summary-card">';
  html += '<h4>💡 避坑建议</h4>';
  html += '<ul>';
  html += '<li>做题前先回顾这些常见错误，提醒自己注意</li>';
  html += '<li>做完题后对照检查，看是否犯了类似错误</li>';
  html += '<li>把做错的题整理到错题本，标注错误原因</li>';
  html += '</ul>';
  html += '</div>';

  return html;
}

// ===== 生成典型例题模块 =====
function generateExamples(kp) {
  var examples = kp.typical_examples || [];
  var html = '';

  if (examples.length === 0) {
    html += '<div class="empty-notice">该知识点暂无典型例题数据。<br>建议参考教材和练习册中的相关习题进行练习。</div>';
    return html;
  }

  html += '<p>通过以下典型例题来巩固对<strong>' + escapeHtml(kp.name) + '</strong>的理解：</p>';

  for (var i = 0; i < examples.length; i++) {
    var ex = examples[i];
    html += '<div class="example-card">';
    html += '<div class="eq">📝 例题 ' + (i + 1) + '：' + escapeHtml(ex.question || '') + '</div>';
    html += '<div class="ea">✅ 答案：' + escapeHtml(ex.answer || '') + '</div>';
    if (ex.tests) {
      html += '<div class="et">考查能力：' + escapeHtml(ex.tests) + '</div>';
    }
    html += '</div>';
  }

  return html;
}

// ===== 生成前置知识模块 =====
function generatePrerequisites(kp) {
  var prereqs = kp.prerequisites || [];
  var html = '';

  if (prereqs.length === 0) {
    html += '<div class="empty-notice">该知识点暂无前置知识数据。<br>如果是全新知识，直接学习即可；如果感觉吃力，建议回顾相关基础内容。</div>';
    return html;
  }

  html += '<p>学习<strong>' + escapeHtml(kp.name) + '</strong>之前，建议先掌握以下基础知识：</p>';
  html += '<div class="prereq-list">';
  for (var i = 0; i < prereqs.length; i++) {
    html += '<span class="prereq-item">' + escapeHtml(prereqs[i]) + '</span>';
  }
  html += '</div>';

  html += '<div class="summary-card">';
  html += '<h4>📌 学习路径建议</h4>';
  html += '<ul>';
  html += '<li>先确认已掌握上述前置知识</li>';
  html += '<li>如有不熟悉的，先复习相关内容</li>';
  html += '<li>前置知识扎实后，再学习本知识点会更轻松</li>';
  html += '</ul>';
  html += '</div>';

  return html;
}

// ===== 生成知识概览模块 =====
function generateOverview(kp) {
  var html = '';
  var subSkills = kp.sub_skills || [];

  html += '<p><strong>' + escapeHtml(kp.name) + '</strong>是' + escapeHtml(kp.subject_name || '') +
         '学科中' + (kp.module ? '「' + escapeHtml(kp.module) + '」模块下' : '') +
         (kp.unit ? '「' + escapeHtml(kp.unit) + '」单元的' : '') + '知识点。</p>';

  // 元信息
  html += '<div class="kp-meta" style="margin: 12px 0;">';
  if (kp.grade) html += '<span class="kp-meta-tag">📚 ' + escapeHtml(kp.grade) + '</span>';
  if (kp.difficulty) html += '<span class="kp-meta-tag">⭐ ' + escapeHtml(kp.difficulty) + '</span>';
  if (kp.semester) html += '<span class="kp-meta-tag">📅 ' + escapeHtml(kp.semester) + '学期</span>';
  if (kp.textbook) html += '<span class="kp-meta-tag">📖 ' + escapeHtml(kp.textbook) + '</span>';
  html += '</div>';

  // 子技能概览
  if (subSkills.length > 0) {
    html += '<h3>本知识点包含以下能力点：</h3>';
    html += '<ul>';
    for (var i = 0; i < subSkills.length; i++) {
      html += '<li>' + escapeHtml(subSkills[i]) + '</li>';
    }
    html += '</ul>';
  }

  // 置信度提示
  if (kp.confidence && kp.confidence !== 'textbook_verified' && kp.confidence !== 'official') {
    html += '<p style="font-size:12px;color:var(--text-muted);margin-top:12px;">' +
            'ℹ️ 本知识点数据置信度：' + escapeHtml(kp.confidence) + '，建议结合教材核对。</p>';
  }

  return html;
}

// ===== HTML 转义 =====
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== 导出 =====
window.Templates = {
  generateRegular: generateRegular,
  generateStory: generateStory,
  generateErrors: generateErrors,
  generateExamples: generateExamples,
  generatePrerequisites: generatePrerequisites,
  generateOverview: generateOverview,
  findAnalogy: findAnalogy,
  detectType: detectType
};

})();
