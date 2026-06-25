/**
 * ============================================================
 *  Ultra Learn Hero - 题库文件 (Question Bank)
 * ============================================================
 *
 * 结构说明：
 *   QUESTION_BANK 是一个全局对象，按年龄分层（4, 5, 6, 7），
 *   每个年龄下按学科分类（math, english, chinese, general），
 *   每个学科包含至少 15 道题目。
 *
 * 题目格式：
 *   {
 *     q:      String,   // 题目文本（英语学科用英文出题）
 *     options: Array,   // 4个选项，其中1个正确
 *     answer: Number,   // 正确答案在 options 中的索引（0-3）
 *     audio:  String    // 题目的自然语言描述，用于 TTS 语音朗读
 *   }
 *
 * 年龄对应：
 *   4 岁 -> 幼儿园小班
 *   5 岁 -> 幼儿园中班
 *   6 岁 -> 幼儿园大班
 *   7 岁 -> 小学一年级
 *
 * 学科对应：
 *   math    -> 数学
 *   english -> 英语
 *   chinese -> 语文
 *   general -> 常识
 *
 * 编码规则：
 *   - 所有字符串使用单引号包裹
 *   - 引用字词使用中文直角引号「」
 *   - 禁止在字符串内使用未转义的双引号或单引号
 * ============================================================
 */

const QUESTION_BANK = {

  // ======================== 4 岁（小班）========================
  4: {

    // ---------- 数学（5以内加减法、认识数字1-5、比大小）----------
    math: [
      { q: '1加2等于多少？', options: ['2', '3', '4', '5'], answer: 1, audio: '一加二等于多少？' },
      { q: '3减1等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '三减一等于多少？' },
      { q: '2加2等于多少？', options: ['3', '4', '5', '6'], answer: 1, audio: '二加二等于多少？' },
      { q: '4减2等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '四减二等于多少？' },
      { q: '1加3等于多少？', options: ['3', '4', '5', '6'], answer: 1, audio: '一加三等于多少？' },
      { q: '5减3等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '五减三等于多少？' },
      { q: '哪个数字最大？', options: ['1', '3', '5', '2'], answer: 2, audio: '下面哪个数字最大？' },
      { q: '哪个数字最小？', options: ['4', '2', '5', '3'], answer: 1, audio: '下面哪个数字最小？' },
      { q: '3和2哪个大？', options: ['一样大', '3大', '2大', '不知道'], answer: 1, audio: '三和二哪个大？' },
      { q: '4减2等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '四减二等于多少？' },
      { q: '2加1等于多少？', options: ['2', '3', '4', '1'], answer: 1, audio: '二加一等于多少？' },
      { q: '5减4等于多少？', options: ['0', '1', '2', '3'], answer: 1, audio: '五减四等于多少？' },
      { q: '1加1等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '一加一等于多少？' },
      { q: '4和1哪个小？', options: ['4小', '1小', '一样小', '不知道'], answer: 1, audio: '四和一哪个小？' },
      { q: '3加2等于多少？', options: ['4', '5', '6', '3'], answer: 1, audio: '三加二等于多少？' }
    ],

    // ---------- 英语（基础单词：apple, cat, dog, sun, moon, red, blue等）----------
    english: [
      { q: 'What is this? It is an apple.', options: ['Apple', 'Banana', 'Cat', 'Dog'], answer: 0, audio: 'What is this? It is an apple.' },
      { q: 'Which animal says meow?', options: ['Dog', 'Cat', 'Bird', 'Fish'], answer: 1, audio: 'Which animal says meow?' },
      { q: 'What color is the sky?', options: ['Red', 'Green', 'Blue', 'Yellow'], answer: 2, audio: 'What color is the sky?' },
      { q: 'What is this? It is a dog.', options: ['Cat', 'Dog', 'Fish', 'Bird'], answer: 1, audio: 'What is this? It is a dog.' },
      { q: 'What shines in the sky at night?', options: ['Sun', 'Moon', 'Star', 'Cloud'], answer: 1, audio: 'What shines in the sky at night?' },
      { q: 'What color is a banana?', options: ['Red', 'Blue', 'Yellow', 'Green'], answer: 2, audio: 'What color is a banana?' },
      { q: 'What is this? It is a cat.', options: ['Dog', 'Cat', 'Duck', 'Fish'], answer: 1, audio: 'What is this? It is a cat.' },
      { q: 'What color is grass?', options: ['Blue', 'Red', 'Yellow', 'Green'], answer: 3, audio: 'What color is grass?' },
      { q: 'What is this? It is the sun.', options: ['Moon', 'Sun', 'Star', 'Cloud'], answer: 1, audio: 'What is this? It is the sun.' },
      { q: 'Which one is a fruit?', options: ['Car', 'Apple', 'Book', 'Pen'], answer: 1, audio: 'Which one is a fruit?' },
      { q: 'What color is blood?', options: ['Blue', 'Green', 'Red', 'Yellow'], answer: 2, audio: 'What color is blood?' },
      { q: 'What animal can swim in water?', options: ['Bird', 'Cat', 'Fish', 'Dog'], answer: 2, audio: 'What animal can swim in water?' },
      { q: 'How do you say「你好」in English?', options: ['Goodbye', 'Hello', 'Thank you', 'Sorry'], answer: 1, audio: 'How do you say hello in English?' },
      { q: 'What is this? It is a bird.', options: ['Fish', 'Bird', 'Cat', 'Dog'], answer: 1, audio: 'What is this? It is a bird.' },
      { q: 'What color is snow?', options: ['Red', 'Blue', 'Green', 'White'], answer: 3, audio: 'What color is snow?' }
    ],

    // ---------- 语文（简单汉字：大/小，上/下，天/地，人/口，日/月，山/水）----------
    chinese: [
      { q: '哪个字读作「大」？', options: ['大', '小', '人', '口'], answer: 0, audio: '哪个字读作大？' },
      { q: '哪个字读作「小」？', options: ['大', '小', '上', '下'], answer: 1, audio: '哪个字读作小？' },
      { q: '哪个字读作「上」？', options: ['上', '下', '左', '右'], answer: 0, audio: '哪个字读作上？' },
      { q: '哪个字读作「天」？', options: ['天', '地', '人', '口'], answer: 0, audio: '哪个字读作天？' },
      { q: '哪个字读作「日」？', options: ['日', '月', '山', '水'], answer: 0, audio: '哪个字读作日？' },
      { q: '哪个字读作「月」？', options: ['日', '月', '水', '山'], answer: 1, audio: '哪个字读作月？' },
      { q: '哪个字读作「山」？', options: ['山', '水', '天', '地'], answer: 0, audio: '哪个字读作山？' },
      { q: '哪个字读作「水」？', options: ['山', '水', '火', '土'], answer: 1, audio: '哪个字读作水？' },
      { q: '「大」的反义词是哪个字？', options: ['多', '小', '少', '高'], answer: 1, audio: '大的反义词是哪个字？' },
      { q: '「上」的反义词是哪个字？', options: ['下', '左', '右', '前'], answer: 0, audio: '上的反义词是哪个字？' },
      { q: '哪个字读作「人」？', options: ['人', '口', '手', '足'], answer: 0, audio: '哪个字读作人？' },
      { q: '哪个字读作「口」？', options: ['目', '口', '耳', '鼻'], answer: 1, audio: '哪个字读作口？' },
      { q: '「天」的反义词是哪个字？', options: ['地', '山', '水', '火'], answer: 0, audio: '天的反义词是哪个字？' },
      { q: '哪个字表示太阳？', options: ['月', '星', '日', '云'], answer: 2, audio: '哪个字表示太阳？' },
      { q: '哪个字表示月亮？', options: ['日', '月', '星', '天'], answer: 1, audio: '哪个字表示月亮？' }
    ],

    // ---------- 常识（动物叫声、太阳方向、水果、颜色）----------
    general: [
      { q: '小猫怎么叫？', options: ['汪汪', '喵喵', '叽叽', '呱呱'], answer: 1, audio: '小猫怎么叫？' },
      { q: '小狗怎么叫？', options: ['喵喵', '汪汪', '咩咩', '嗡嗡'], answer: 1, audio: '小狗怎么叫？' },
      { q: '太阳从哪边升起？', options: ['西边', '东边', '南边', '北边'], answer: 1, audio: '太阳从哪边升起？' },
      { q: '苹果是什么颜色的？', options: ['红色', '蓝色', '绿色', '紫色'], answer: 0, audio: '苹果是什么颜色的？' },
      { q: '香蕉是什么颜色的？', options: ['红色', '黄色', '绿色', '白色'], answer: 1, audio: '香蕉是什么颜色的？' },
      { q: '小青蛙怎么叫？', options: ['汪汪', '喵喵', '呱呱', '叽叽'], answer: 2, audio: '小青蛙怎么叫？' },
      { q: '小羊怎么叫？', options: ['咩咩', '汪汪', '喵喵', '呱呱'], answer: 0, audio: '小羊怎么叫？' },
      { q: '小鸡怎么叫？', options: ['汪汪', '叽叽', '呱呱', '嗡嗡'], answer: 1, audio: '小鸡怎么叫？' },
      { q: '西瓜是什么颜色的？', options: ['红色', '黄色', '绿色外皮红色果肉', '紫色'], answer: 2, audio: '西瓜是什么颜色的？' },
      { q: '我们用什么吃饭？', options: ['手', '筷子', '脚', '耳朵'], answer: 1, audio: '我们用什么吃饭？' },
      { q: '一年有几个季节？', options: ['两个', '三个', '四个', '五个'], answer: 2, audio: '一年有几个季节？' },
      { q: '天空是什么颜色的？', options: ['红色', '蓝色', '绿色', '黄色'], answer: 1, audio: '天空是什么颜色的？' },
      { q: '小牛怎么叫？', options: ['汪汪', '喵喵', '哞哞', '咩咩'], answer: 2, audio: '小牛怎么叫？' },
      { q: '白天能看到什么？', options: ['月亮', '星星', '太阳', '彩虹'], answer: 2, audio: '白天能看到什么？' },
      { q: '树叶是什么颜色的？', options: ['红色', '蓝色', '黄色', '绿色'], answer: 3, audio: '树叶是什么颜色的？' }
    ]
  },

  // ======================== 5 岁（中班）========================
  5: {

    // ---------- 数学（10以内加减法、认识图形、数数）----------
    math: [
      { q: '5加3等于多少？', options: ['7', '8', '9', '6'], answer: 1, audio: '五加三等于多少？' },
      { q: '8减3等于多少？', options: ['4', '5', '6', '3'], answer: 1, audio: '八减三等于多少？' },
      { q: '6加4等于多少？', options: ['9', '10', '8', '11'], answer: 1, audio: '六加四等于多少？' },
      { q: '10减5等于多少？', options: ['4', '6', '5', '3'], answer: 2, audio: '十减五等于多少？' },
      { q: '7加2等于多少？', options: ['8', '9', '10', '7'], answer: 1, audio: '七加二等于多少？' },
      { q: '圆形有几个角？', options: ['0个', '1个', '2个', '3个'], answer: 0, audio: '圆形有几个角？' },
      { q: '三角形有几个角？', options: ['2个', '3个', '4个', '5个'], answer: 1, audio: '三角形有几个角？' },
      { q: '正方形有几条边？', options: ['3条', '4条', '5条', '6条'], answer: 1, audio: '正方形有几条边？' },
      { q: '9减4等于多少？', options: ['4', '5', '6', '3'], answer: 1, audio: '九减四等于多少？' },
      { q: '从1数到10，第6个数是几？', options: ['5', '6', '7', '8'], answer: 1, audio: '从一数到十，第六个数是几？' },
      { q: '4加5等于多少？', options: ['8', '9', '10', '7'], answer: 1, audio: '四加五等于多少？' },
      { q: '10减2等于多少？', options: ['7', '8', '9', '6'], answer: 1, audio: '十减二等于多少？' },
      { q: '长方形有几条边？', options: ['3条', '4条', '5条', '6条'], answer: 1, audio: '长方形有几条边？' },
      { q: '3加7等于多少？', options: ['9', '10', '11', '8'], answer: 1, audio: '三加七等于多少？' },
      { q: '8减6等于多少？', options: ['1', '2', '3', '4'], answer: 1, audio: '八减六等于多少？' }
    ],

    // ---------- 英语（英文数字1-10、颜色、动物、身体部位）----------
    english: [
      { q: 'How do you say「三」in English?', options: ['Two', 'Three', 'Four', 'Five'], answer: 1, audio: 'How do you say three in English?' },
      { q: 'How do you say「七」in English?', options: ['Six', 'Seven', 'Eight', 'Nine'], answer: 1, audio: 'How do you say seven in English?' },
      { q: 'What color is an orange?', options: ['Red', 'Orange', 'Yellow', 'Pink'], answer: 1, audio: 'What color is an orange?' },
      { q: 'What color is a frog?', options: ['Blue', 'Red', 'Green', 'Yellow'], answer: 2, audio: 'What color is a frog?' },
      { q: 'Which animal has a long trunk?', options: ['Lion', 'Elephant', 'Tiger', 'Monkey'], answer: 1, audio: 'Which animal has a long trunk?' },
      { q: 'We use our eyes to see. We use our ears to...', options: ['See', 'Hear', 'Smell', 'Taste'], answer: 1, audio: 'We use our eyes to see. We use our ears to do what?' },
      { q: 'How many fingers do you have on one hand?', options: ['Three', 'Four', 'Five', 'Six'], answer: 2, audio: 'How many fingers do you have on one hand?' },
      { q: 'What color is a grape?', options: ['Red', 'Purple', 'Green', 'Blue'], answer: 1, audio: 'What color is a grape?' },
      { q: 'Which animal can fly?', options: ['Fish', 'Dog', 'Bird', 'Cat'], answer: 2, audio: 'Which animal can fly?' },
      { q: 'We use our nose to...', options: ['See', 'Hear', 'Smell', 'Walk'], answer: 2, audio: 'We use our nose to do what?' },
      { q: 'How do you say「十」in English?', options: ['Nine', 'Ten', 'Eleven', 'Eight'], answer: 1, audio: 'How do you say ten in English?' },
      { q: 'What color is a rabbit?', options: ['Green', 'Blue', 'White', 'Red'], answer: 2, audio: 'What color is a rabbit?' },
      { q: 'Which animal lives in water?', options: ['Dog', 'Cat', 'Fish', 'Bird'], answer: 2, audio: 'Which animal lives in water?' },
      { q: 'We use our mouth to...', options: ['See', 'Hear', 'Eat', 'Walk'], answer: 2, audio: 'We use our mouth to do what?' },
      { q: 'How do you say「红色」in English?', options: ['Blue', 'Green', 'Red', 'Yellow'], answer: 2, audio: 'How do you say red in English?' }
    ],

    // ---------- 语文（笔画认知、反义词、常见动词）----------
    chinese: [
      { q: '「大」字有几画？', options: ['2画', '3画', '4画', '5画'], answer: 1, audio: '大字有几画？' },
      { q: '「山」字有几画？', options: ['2画', '3画', '4画', '5画'], answer: 1, audio: '山字有几画？' },
      { q: '「水」字有几画？', options: ['3画', '4画', '5画', '6画'], answer: 1, audio: '水字有几画？' },
      { q: '「多」的反义词是哪个字？', options: ['大', '少', '小', '高'], answer: 1, audio: '多的反义词是哪个字？' },
      { q: '「高」的反义词是哪个字？', options: ['矮', '低', '短', '小'], answer: 0, audio: '高的反义词是哪个字？' },
      { q: '「长」的反义词是哪个字？', options: ['大', '多', '短', '小'], answer: 2, audio: '长的反义词是哪个字？' },
      { q: '「黑」的反义词是哪个字？', options: ['白', '红', '绿', '黄'], answer: 0, audio: '黑的反义词是哪个字？' },
      { q: '哪个字表示「跑」的意思？', options: ['走', '跑', '跳', '飞'], answer: 1, audio: '哪个字表示跑的意思？' },
      { q: '哪个字表示「吃」的意思？', options: ['喝', '吃', '看', '听'], answer: 1, audio: '哪个字表示吃的意思？' },
      { q: '「日」字有几画？', options: ['3画', '4画', '5画', '6画'], answer: 1, audio: '日字有几画？' },
      { q: '「月」字有几画？', options: ['3画', '4画', '5画', '6画'], answer: 1, audio: '月字有几画？' },
      { q: '「来」的反义词是哪个字？', options: ['去', '回', '走', '跑'], answer: 0, audio: '来的反义词是哪个字？' },
      { q: '哪个字表示「看」的意思？', options: ['听', '说', '看', '写'], answer: 2, audio: '哪个字表示看的意思？' },
      { q: '「前」的反义词是哪个字？', options: ['后', '左', '右', '上'], answer: 0, audio: '前的反义词是哪个字？' },
      { q: '「开」的反义词是哪个字？', options: ['关', '合', '闭', '停'], answer: 0, audio: '开的反义词是哪个字？' }
    ],

    // ---------- 常识（季节、交通工具、职业、安全常识）----------
    general: [
      { q: '春天后面是什么季节？', options: ['夏天', '秋天', '冬天', '春天'], answer: 0, audio: '春天后面是什么季节？' },
      { q: '什么车有两条铁轨？', options: ['汽车', '自行车', '火车', '飞机'], answer: 2, audio: '什么车有两条铁轨？' },
      { q: '谁在医院给病人看病？', options: ['老师', '医生', '警察', '厨师'], answer: 1, audio: '谁在医院给病人看病？' },
      { q: '过马路时应该看什么灯？', options: ['红灯', '绿灯', '黄灯', '蓝灯'], answer: 1, audio: '过马路时应该看什么灯？' },
      { q: '什么交通工具在天上飞？', options: ['轮船', '火车', '汽车', '飞机'], answer: 3, audio: '什么交通工具在天上飞？' },
      { q: '谁在学校教学生读书？', options: ['医生', '警察', '老师', '司机'], answer: 2, audio: '谁在学校教学生读书？' },
      { q: '什么季节树叶会变黄？', options: ['春天', '夏天', '秋天', '冬天'], answer: 2, audio: '什么季节树叶会变黄？' },
      { q: '什么车有四个轮子，能在路上跑？', options: ['飞机', '轮船', '汽车', '火车'], answer: 2, audio: '什么车有四个轮子，能在路上跑？' },
      { q: '谁负责抓坏人？', options: ['老师', '医生', '消防员', '警察'], answer: 3, audio: '谁负责抓坏人？' },
      { q: '着火了应该打什么电话？', options: ['110', '119', '120', '122'], answer: 1, audio: '着火了应该打什么电话？' },
      { q: '冬天天气怎么样？', options: ['很热', '很冷', '很暖', '很湿'], answer: 1, audio: '冬天天气怎么样？' },
      { q: '什么交通工具在水上走？', options: ['飞机', '火车', '汽车', '轮船'], answer: 3, audio: '什么交通工具在水上走？' },
      { q: '谁在厨房做饭？', options: ['老师', '医生', '厨师', '警察'], answer: 2, audio: '谁在厨房做饭？' },
      { q: '不能随便碰什么东西？', options: ['玩具', '书本', '电源插座', '铅笔'], answer: 2, audio: '不能随便碰什么东西？' },
      { q: '什么季节会下雪？', options: ['春天', '夏天', '秋天', '冬天'], answer: 3, audio: '什么季节会下雪？' }
    ]
  },

  // ======================== 6 岁（大班）========================
  6: {

    // ---------- 数学（20以内加减法、钟表、乘法概念）----------
    math: [
      { q: '8加7等于多少？', options: ['14', '15', '16', '13'], answer: 1, audio: '八加七等于多少？' },
      { q: '15减8等于多少？', options: ['6', '7', '8', '9'], answer: 1, audio: '十五减八等于多少？' },
      { q: '12加6等于多少？', options: ['17', '18', '19', '16'], answer: 1, audio: '十二加六等于多少？' },
      { q: '20减9等于多少？', options: ['10', '11', '12', '13'], answer: 1, audio: '二十减九等于多少？' },
      { q: '9加5等于多少？', options: ['13', '14', '15', '12'], answer: 1, audio: '九加五等于多少？' },
      { q: '钟面上短针指向3，长针指向12，是几点？', options: ['1点', '3点', '6点', '9点'], answer: 1, audio: '钟面上短针指向3，长针指向12，是几点？' },
      { q: '钟面上短针指向6，长针指向12，是几点？', options: ['3点', '6点', '9点', '12点'], answer: 1, audio: '钟面上短针指向6，长针指向12，是几点？' },
      { q: '3个2相加等于多少？', options: ['4', '5', '6', '7'], answer: 2, audio: '三个二相加等于多少？' },
      { q: '4个2相加等于多少？', options: ['6', '7', '8', '9'], answer: 2, audio: '四个二相加等于多少？' },
      { q: '17减9等于多少？', options: ['7', '8', '9', '6'], answer: 1, audio: '十七减九等于多少？' },
      { q: '11加4等于多少？', options: ['14', '15', '16', '13'], answer: 1, audio: '十一加四等于多少？' },
      { q: '5个2相加等于多少？', options: ['8', '9', '10', '11'], answer: 2, audio: '五个二相加等于多少？' },
      { q: '钟面上有几个数字？', options: ['10个', '12个', '14个', '11个'], answer: 1, audio: '钟面上有几个数字？' },
      { q: '14加3等于多少？', options: ['16', '17', '18', '15'], answer: 1, audio: '十四加三等于多少？' },
      { q: '19减7等于多少？', options: ['11', '12', '13', '10'], answer: 1, audio: '十九减七等于多少？' }
    ],

    // ---------- 英语（简单英文句子、问候语）----------
    english: [
      { q: 'How do you say「早上好」in English?', options: ['Good night', 'Good morning', 'Good afternoon', 'Good evening'], answer: 1, audio: 'How do you say good morning in English?' },
      { q: 'How do you say「谢谢」in English?', options: ['Sorry', 'Hello', 'Thank you', 'Goodbye'], answer: 2, audio: 'How do you say thank you in English?' },
      { q: 'What is your name?', options: ['I am fine.', 'My name is Tom.', 'I am five.', 'I like cats.'], answer: 1, audio: 'What is your name?' },
      { q: 'How old are you?', options: ['I am fine.', 'I am happy.', 'I am six.', 'I like red.'], answer: 2, audio: 'How old are you?' },
      { q: 'How do you say「再见」in English?', options: ['Hello', 'Sorry', 'Thank you', 'Goodbye'], answer: 3, audio: 'How do you say goodbye in English?' },
      { q: 'I like to eat apples. What do you like?', options: ['I like to sleep.', 'I like to play.', 'I like bananas.', 'I am fine.'], answer: 2, audio: 'I like to eat apples. What do you like?' },
      { q: 'What color do you like?', options: ['I am six.', 'I like blue.', 'I have a dog.', 'I can run.'], answer: 1, audio: 'What color do you like?' },
      { q: 'How do you say「下午好」in English?', options: ['Good morning', 'Good afternoon', 'Good night', 'Goodbye'], answer: 1, audio: 'How do you say good afternoon in English?' },
      { q: 'Can you sing?', options: ['Yes, I can.', 'No, I am fine.', 'I like cats.', 'I am six.'], answer: 0, audio: 'Can you sing?' },
      { q: 'What is this? It is a book.', options: ['Book', 'Pen', 'Bag', 'Desk'], answer: 0, audio: 'What is this? It is a book.' },
      { q: 'How do you say「对不起」in English?', options: ['Hello', 'Thank you', 'Sorry', 'Goodbye'], answer: 2, audio: 'How do you say sorry in English?' },
      { q: 'I have two hands. How many hands do you have?', options: ['One', 'Two', 'Three', 'Four'], answer: 1, audio: 'I have two hands. How many hands do you have?' },
      { q: 'Where is the cat?', options: ['It is on the table.', 'I like cats.', 'It is red.', 'It can run.'], answer: 0, audio: 'Where is the cat?' },
      { q: 'Do you like milk?', options: ['Yes, I do.', 'I am six.', 'I can swim.', 'It is white.'], answer: 0, audio: 'Do you like milk?' },
      { q: 'How do you say「晚安」in English?', options: ['Good morning', 'Good afternoon', 'Good evening', 'Good night'], answer: 3, audio: 'How do you say good night in English?' }
    ],

    // ---------- 语文（拼音声母韵母、组词）----------
    chinese: [
      { q: '拼音「b」是声母还是韵母？', options: ['声母', '韵母', '都不是', '都是'], answer: 0, audio: '拼音b是声母还是韵母？' },
      { q: '拼音「a」是声母还是韵母？', options: ['声母', '韵母', '都不是', '都是'], answer: 1, audio: '拼音a是声母还是韵母？' },
      { q: '「花」字的拼音是什么？', options: ['hua', 'hua', 'fa', 'ha'], answer: 0, audio: '花字的拼音是什么？' },
      { q: '「学」字可以组什么词？', options: ['学校', '学校', '学者', '学习'], answer: 0, audio: '学字可以组什么词？' },
      { q: '「天」字可以组什么词？', options: ['天空', '天空', '天气', '天地'], answer: 0, audio: '天字可以组什么词？' },
      { q: '下面哪个是韵母？', options: ['b', 'm', 'a', 'd'], answer: 2, audio: '下面哪个是韵母？' },
      { q: '下面哪个是声母？', options: ['a', 'o', 'e', 'p'], answer: 3, audio: '下面哪个是声母？' },
      { q: '「水」字可以组什么词？', options: ['水果', '水果', '喝水', '水池'], answer: 0, audio: '水字可以组什么词？' },
      { q: '「山」字可以组什么词？', options: ['山上', '山上', '山水', '高山'], answer: 0, audio: '山字可以组什么词？' },
      { q: '拼音「e」是声母还是韵母？', options: ['声母', '韵母', '都不是', '都是'], answer: 1, audio: '拼音e是声母还是韵母？' },
      { q: '「大」字可以组什么词？', options: ['大家', '大家', '大小', '大人'], answer: 0, audio: '大字可以组什么词？' },
      { q: '「风」字的拼音是什么？', options: ['feng', 'feng', 'fen', 'feng'], answer: 0, audio: '风字的拼音是什么？' },
      { q: '「雨」字可以组什么词？', options: ['下雨', '下雨', '雨水', '大雨'], answer: 0, audio: '雨字可以组什么词？' },
      { q: '下面哪个不是声母？', options: ['b', 'p', 'a', 'm'], answer: 2, audio: '下面哪个不是声母？' },
      { q: '「鸟」字可以组什么词？', options: ['小鸟', '小鸟', '鸟儿', '飞鸟'], answer: 0, audio: '鸟字可以组什么词？' }
    ],

    // ---------- 常识（自然现象、中国节日、环保）----------
    general: [
      { q: '雨后天空会出现什么？', options: ['月亮', '星星', '彩虹', '太阳'], answer: 2, audio: '雨后天空会出现什么？' },
      { q: '春节是哪一天？', options: ['一月一日', '农历正月初一', '五月一日', '十月一日'], answer: 1, audio: '春节是哪一天？' },
      { q: '我们应该把垃圾扔到哪里？', options: ['地上', '河里', '垃圾桶', '路边'], answer: 2, audio: '我们应该把垃圾扔到哪里？' },
      { q: '水结冰后变成什么？', options: ['水蒸气', '冰', '雪', '雨'], answer: 1, audio: '水结冰后变成什么？' },
      { q: '端午节要吃什么？', options: ['月饼', '粽子', '汤圆', '饺子'], answer: 1, audio: '端午节要吃什么？' },
      { q: '为什么要节约用水？', options: ['水很多', '水是有限的资源', '水不好喝', '水很便宜'], answer: 1, audio: '为什么要节约用水？' },
      { q: '闪电之后会听到什么？', options: ['风声', '雨声', '雷声', '鸟叫声'], answer: 2, audio: '闪电之后会听到什么？' },
      { q: '中秋节要吃什么？', options: ['粽子', '月饼', '汤圆', '饺子'], answer: 1, audio: '中秋节要吃什么？' },
      { q: '白天和黑夜是怎么产生的？', options: ['地球自转', '太阳移动', '月亮移动', '风吹的'], answer: 0, audio: '白天和黑夜是怎么产生的？' },
      { q: '哪种行为能保护环境？', options: ['乱扔垃圾', '节约用纸', '浪费水', '砍树'], answer: 1, audio: '哪种行为能保护环境？' },
      { q: '太阳是什么？', options: ['行星', '恒星', '卫星', '彗星'], answer: 1, audio: '太阳是什么？' },
      { q: '元宵节要吃什么？', options: ['月饼', '粽子', '汤圆', '饺子'], answer: 2, audio: '元宵节要吃什么？' },
      { q: ' recycling 是什么意思？', options: ['浪费', '回收利用', '丢弃', '燃烧'], answer: 1, audio: '回收利用是什么意思？' },
      { q: '月亮绕着什么转？', options: ['太阳', '地球', '星星', '火星'], answer: 1, audio: '月亮绕着什么转？' },
      { q: '国庆节是几月几日？', options: ['一月一日', '五月一日', '十月一日', '六月一日'], answer: 2, audio: '国庆节是几月几日？' }
    ]
  },

  // ======================== 7 岁（一年级）========================
  7: {

    // ---------- 数学（100以内加减法、乘法口诀1-5、人民币）----------
    math: [
      { q: '25加18等于多少？', options: ['42', '43', '44', '41'], answer: 1, audio: '二十五加十八等于多少？' },
      { q: '50减23等于多少？', options: ['26', '27', '28', '25'], answer: 1, audio: '五十减二十三等于多少？' },
      { q: '37加46等于多少？', options: ['82', '83', '84', '81'], answer: 1, audio: '三十七加四十六等于多少？' },
      { q: '80减35等于多少？', options: ['44', '45', '46', '43'], answer: 1, audio: '八十减三十五等于多少？' },
      { q: '二三得几？', options: ['4', '5', '6', '7'], answer: 2, audio: '二三得几？' },
      { q: '三四得几？', options: ['10', '11', '12', '13'], answer: 2, audio: '三四得几？' },
      { q: '四五得几？', options: ['18', '19', '20', '21'], answer: 2, audio: '四五得几？' },
      { q: '二五一十，二六得几？', options: ['10', '11', '12', '13'], answer: 2, audio: '二五一十，二六得几？' },
      { q: '1元等于多少角？', options: ['5角', '10角', '8角', '12角'], answer: 1, audio: '一元等于多少角？' },
      { q: '3元5角等于多少角？', options: ['30角', '35角', '25角', '40角'], answer: 1, audio: '三元五角等于多少角？' },
      { q: '48加27等于多少？', options: ['74', '75', '76', '73'], answer: 1, audio: '四十八加二十七等于多少？' },
      { q: '90减38等于多少？', options: ['51', '52', '53', '50'], answer: 1, audio: '九十减三十八等于多少？' },
      { q: '一五得几？', options: ['3', '4', '5', '6'], answer: 2, audio: '一五得几？' },
      { q: '3元减1元5角等于多少？', options: ['1元5角', '2元', '1元', '2元5角'], answer: 0, audio: '三元减一元五角等于多少？' },
      { q: '63加29等于多少？', options: ['91', '92', '93', '90'], answer: 1, audio: '六十三加二十九等于多少？' }
    ],

    // ---------- 英语（自我介绍、家庭成员、日常用品）----------
    english: [
      { q: 'Hello, my name is Lily. What is your name?', options: ['My name is Tom.', 'I am fine.', 'I am seven.', 'I like red.'], answer: 0, audio: 'Hello, my name is Lily. What is your name?' },
      { q: 'How many people are in your family?', options: ['I have three.', 'There are four.', 'I like my family.', 'I am fine.'], answer: 1, audio: 'How many people are in your family?' },
      { q: 'Who is your mother\'s mother?', options: ['Sister', 'Aunt', 'Grandmother', 'Cousin'], answer: 2, audio: 'Who is your mother\'s mother?' },
      { q: 'What is this? It is a pencil.', options: ['Pencil', 'Pen', 'Ruler', 'Eraser'], answer: 0, audio: 'What is this? It is a pencil.' },
      { q: 'Where is your book?', options: ['It is in my bag.', 'I like books.', 'It is red.', 'I can read.'], answer: 0, audio: 'Where is your book?' },
      { q: 'This is my father. He is a doctor.', options: ['Teacher', 'Doctor', 'Driver', 'Cook'], answer: 1, audio: 'This is my father. He is a doctor.' },
      { q: 'What do you use to write?', options: ['Ruler', 'Eraser', 'Pencil', 'Book'], answer: 2, audio: 'What do you use to write?' },
      { q: 'I have a brother. He is older than me.', options: ['Sister', 'Brother', 'Cousin', 'Friend'], answer: 1, audio: 'I have a brother. He is older than me.' },
      { q: 'What is on the desk?', options: ['A lamp is on the desk.', 'I like the desk.', 'The desk is big.', 'It is red.'], answer: 0, audio: 'What is on the desk?' },
      { q: 'How do you go to school?', options: ['I like school.', 'By bus.', 'I am seven.', 'School is big.'], answer: 1, audio: 'How do you go to school?' },
      { q: 'What can you do?', options: ['I can swim.', 'I am fine.', 'I like cats.', 'I have a dog.'], answer: 0, audio: 'What can you do?' },
      { q: 'This is my sister. She likes to sing.', options: ['Dance', 'Sing', 'Draw', 'Read'], answer: 1, audio: 'This is my sister. She likes to sing.' },
      { q: 'What is in your pencil box?', options: ['Pencils and erasers.', 'I like pencils.', 'It is blue.', 'It is big.'], answer: 0, audio: 'What is in your pencil box?' },
      { q: 'Who is your father\'s father?', options: ['Uncle', 'Brother', 'Grandfather', 'Cousin'], answer: 2, audio: 'Who is your father\'s father?' },
      { q: 'Nice to meet you.', options: ['Nice to meet you too.', 'I am fine.', 'Thank you.', 'Goodbye.'], answer: 0, audio: 'Nice to meet you.' }
    ],

    // ---------- 语文（拼音拼读、同音字、造句）----------
    chinese: [
      { q: '「mā」是哪个字的拼音？', options: ['马', '妈', '吗', '骂'], answer: 1, audio: 'ma第一声是哪个字的拼音？' },
      { q: '「shì」和「是」是同音字吗？', options: ['是', '不是', '不确定', '有时是'], answer: 0, audio: 'shi和是是同音字吗？' },
      { q: '「木」和「目」读音一样吗？', options: ['一样', '不一样', '有时一样', '不知道'], answer: 0, audio: '木和目读音一样吗？' },
      { q: '用「快乐」造一个句子，下面哪个正确？', options: ['我今天很快乐。', '快乐是好的。', '我很快乐。', '快乐地玩。'], answer: 0, audio: '用快乐造一个句子，下面哪个正确？' },
      { q: '「yú」是哪个字的拼音？', options: ['鱼', '雨', '语', '宇'], answer: 0, audio: 'yu第二声是哪个字的拼音？' },
      { q: '「lì」和「力」是什么关系？', options: ['同音字', '反义词', '近义词', '没关系'], answer: 0, audio: 'li和力是什么关系？' },
      { q: '用「喜欢」造一个句子，下面哪个正确？', options: ['我喜欢吃苹果。', '喜欢很好。', '我喜欢。', '喜欢苹果。'], answer: 0, audio: '用喜欢造一个句子，下面哪个正确？' },
      { q: '「zhōng」是哪个字的拼音？', options: ['中', '钟', '终', '种'], answer: 0, audio: 'zhong第一声是哪个字的拼音？' },
      { q: '「做」和「作」读音一样吗？', options: ['一样', '不一样', '有时一样', '不知道'], answer: 0, audio: '做和作读音一样吗？' },
      { q: '用「美丽」造一个句子，下面哪个正确？', options: ['花很美丽。', '美丽是好的。', '美丽花。', '很美丽。'], answer: 0, audio: '用美丽造一个句子，下面哪个正确？' },
      { q: '「qīng」是哪个字的拼音？', options: ['青', '清', '轻', '情'], answer: 0, audio: 'qing第一声是哪个字的拼音？' },
      { q: '下面哪组是同音字？', options: ['大和太', '上和下', '多和少', '来和去'], answer: 0, audio: '下面哪组是同音字？' },
      { q: '用「高兴」造一个句子，下面哪个正确？', options: ['我很高兴。', '高兴很好。', '高兴地。', '高兴人。'], answer: 0, audio: '用高兴造一个句子，下面哪个正确？' },
      { q: '「huā」是哪个字的拼音？', options: ['花', '画', '话', '化'], answer: 0, audio: 'hua第一声是哪个字的拼音？' },
      { q: '「jī」可以表示哪些字？', options: ['鸡、机、击', '鸡、鸭、鹅', '大、小、多', '天、地、人'], answer: 0, audio: 'ji第一声可以表示哪些字？' }
    ],

    // ---------- 常识（地理、科学、历史常识）----------
    general: [
      { q: '中国最长的河流是什么？', options: ['黄河', '长江', '珠江', '淮河'], answer: 1, audio: '中国最长的河流是什么？' },
      { q: '水在多少度会沸腾？', options: ['50度', '80度', '100度', '120度'], answer: 2, audio: '水在多少度会沸腾？' },
      { q: '中国古代四大发明不包括哪个？', options: ['造纸术', '印刷术', '火药', '陶瓷'], answer: 3, audio: '中国古代四大发明不包括哪个？' },
      { q: '世界上最大的洲是哪个？', options: ['非洲', '欧洲', '亚洲', '美洲'], answer: 2, audio: '世界上最大的洲是哪个？' },
      { q: '植物靠什么进行光合作用？', options: ['水', '阳光', '空气', '以上都是'], answer: 3, audio: '植物靠什么进行光合作用？' },
      { q: '中国的首都是哪里？', options: ['上海', '北京', '广州', '深圳'], answer: 1, audio: '中国的首都是哪里？' },
      { q: '地球绕太阳转一圈需要多久？', options: ['一天', '一个月', '一年', '一周'], answer: 2, audio: '地球绕太阳转一圈需要多久？' },
      { q: '恐龙是什么时候灭绝的？', options: ['一万年前', '几千万年前', '一百年前', '一千年前'], answer: 1, audio: '恐龙是什么时候灭绝的？' },
      { q: '世界上最高的山峰是什么？', options: ['黄山', '泰山', '珠穆朗玛峰', '华山'], answer: 2, audio: '世界上最高的山峰是什么？' },
      { q: '磁铁能吸引什么？', options: ['木头', '塑料', '铁', '纸'], answer: 2, audio: '磁铁能吸引什么？' },
      { q: '中国有多少个省级行政区？', options: ['23个', '34个', '30个', '50个'], answer: 1, audio: '中国有多少个省级行政区？' },
      { q: '太阳系中最大的行星是哪个？', options: ['地球', '火星', '木星', '土星'], answer: 2, audio: '太阳系中最大的行星是哪个？' },
      { q: '万里长城在哪个国家？', options: ['日本', '韩国', '中国', '印度'], answer: 2, audio: '万里长城在哪个国家？' },
      { q: '蝙蝠是鸟类吗？', options: ['是鸟类', '是哺乳动物', '是昆虫', '是鱼类'], answer: 1, audio: '蝙蝠是鸟类吗？' },
      { q: '月球绕地球转一圈需要多久？', options: ['一天', '一周', '一个月', '一年'], answer: 2, audio: '月球绕地球转一圈需要多久？' }
    ]
  }
};

window.QUESTION_BANK = QUESTION_BANK;
