/**
 * 学智云学习平台 - API接口封装
 * 当前使用本地数据，为未来云端API预留接口
 */

const API = {
    // API基础URL（未来云端API）
    baseUrl: '/api',

    /**
     * 模拟题库数据
     * 每个年级每个学科至少5道题目
     */
    mockQuestions: [
        // ===== 一年级题目 =====
        // 一年级数学
        { id: 'q-math-1-001', subject: 'math', grade: 1, knowledgePoint: '数字认识', difficulty: 1, type: 'choice', content: '数字5后面是哪个数字？', options: ['A. 4', 'B. 6', 'C. 7', 'D. 8'], answer: 'B', explanation: '数字顺序是1、2、3、4、5、6、7...，所以5后面是6。', createdAt: '2026-01-01' },
        { id: 'q-math-1-002', subject: 'math', grade: 1, knowledgePoint: '数数', difficulty: 1, type: 'choice', content: '下面有几个苹果？🍎🍎🍎', options: ['A. 2个', 'B. 3个', 'C. 4个', 'D. 5个'], answer: 'B', explanation: '数一数，有3个苹果。', createdAt: '2026-01-01' },
        { id: 'q-math-1-003', subject: 'math', grade: 1, knowledgePoint: '大小比较', difficulty: 1, type: 'choice', content: '哪个数字最大？', options: ['A. 3', 'B. 5', 'C. 7', 'D. 2'], answer: 'C', explanation: '比较这四个数字，7最大。', createdAt: '2026-01-01' },
        { id: 'q-math-1-004', subject: 'math', grade: 1, knowledgePoint: '加法入门', difficulty: 2, type: 'choice', content: '1 + 2 = ?', options: ['A. 2', 'B. 3', 'C. 4', 'D. 5'], answer: 'B', explanation: '1 + 2 = 3。', createdAt: '2026-01-01' },
        { id: 'q-math-1-005', subject: 'math', grade: 1, knowledgePoint: '减法入门', difficulty: 2, type: 'choice', content: '3 - 1 = ?', options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'], answer: 'B', explanation: '3 - 1 = 2。', createdAt: '2026-01-01' },
        // 一年级语文
        { id: 'q-chinese-1-001', subject: 'chinese', grade: 1, knowledgePoint: '拼音', difficulty: 1, type: 'choice', content: '"大"的拼音是？', options: ['A. dà', 'B. dài', 'C. dá', 'D. dǎ'], answer: 'A', explanation: '"大"的拼音是dà。', createdAt: '2026-01-01' },
        { id: 'q-chinese-1-002', subject: 'chinese', grade: 1, knowledgePoint: '拼音', difficulty: 1, type: 'choice', content: '"小"的拼音是？', options: ['A. xiāo', 'B. xiǎo', 'C. xiào', 'D. xiá'], answer: 'B', explanation: '"小"的拼音是xiǎo。', createdAt: '2026-01-01' },
        { id: 'q-chinese-1-003', subject: 'chinese', grade: 1, knowledgePoint: '笔画', difficulty: 2, type: 'choice', content: '"一"有几笔？', options: ['A. 1笔', 'B. 2笔', 'C. 3笔', 'D. 4笔'], answer: 'A', explanation: '"一"只有1笔。', createdAt: '2026-01-01' },
        { id: 'q-chinese-1-004', subject: 'chinese', grade: 1, knowledgePoint: '汉字', difficulty: 2, type: 'choice', content: '"人"字怎么读？', options: ['A. rén', 'B. rén', 'C. rēn', 'D. rèn'], answer: 'A', explanation: '"人"的拼音是rén。', createdAt: '2026-01-01' },
        { id: 'q-chinese-1-005', subject: 'chinese', grade: 1, knowledgePoint: '词语', difficulty: 2, type: 'choice', content: '"妈妈"的反义词是？', options: ['A. 爸爸', 'B. 姐姐', 'C. 哥哥', 'D. 奶奶'], answer: 'A', explanation: '妈妈和爸爸是对应的称呼。', createdAt: '2026-01-01' },
        // 一年级英语
        { id: 'q-english-1-001', subject: 'english', grade: 1, knowledgePoint: '字母', difficulty: 1, type: 'choice', content: '字母"A"后面是哪个字母？', options: ['A. B', 'B. C', 'C. D', 'D. E'], answer: 'A', explanation: '字母顺序是A、B、C...，所以A后面是B。', createdAt: '2026-01-01' },
        { id: 'q-english-1-002', subject: 'english', grade: 1, knowledgePoint: '字母', difficulty: 1, type: 'choice', content: '"B"的大写字母是？', options: ['A. b', 'B. B', 'C. D', 'D. C'], answer: 'B', explanation: 'B本身就是大写字母。', createdAt: '2026-01-01' },
        { id: 'q-english-1-003', subject: 'english', grade: 1, knowledgePoint: '单词', difficulty: 2, type: 'choice', content: '"dog"的中文意思是？', options: ['A. 猫', 'B. 狗', 'C. 鸟', 'D. 鱼'], answer: 'B', explanation: 'dog的意思是狗。', createdAt: '2026-01-01' },
        { id: 'q-english-1-004', subject: 'english', grade: 1, knowledgePoint: '单词', difficulty: 2, type: 'choice', content: '"cat"的中文意思是？', options: ['A. 猫', 'B. 狗', 'C. 鸟', 'D. 鱼'], answer: 'A', explanation: 'cat的意思是猫。', createdAt: '2026-01-01' },
        { id: 'q-english-1-005', subject: 'english', grade: 1, knowledgePoint: '颜色', difficulty: 2, type: 'choice', content: '"red"的中文意思是？', options: ['A. 蓝色', 'B. 绿色', 'C. 红色', 'D. 黄色'], answer: 'C', explanation: 'red的意思是红色。', createdAt: '2026-01-01' },
        // 一年级科学
        { id: 'q-science-1-001', subject: 'science', grade: 1, knowledgePoint: '动物', difficulty: 1, type: 'choice', content: '兔子有几条腿？', options: ['A. 2条', 'B. 3条', 'C. 4条', 'D. 6条'], answer: 'C', explanation: '兔子有4条腿。', createdAt: '2026-01-01' },
        { id: 'q-science-1-002', subject: 'science', grade: 1, knowledgePoint: '植物', difficulty: 1, type: 'choice', content: '苹果是什么颜色的？', options: ['A. 蓝色', 'B. 红色/绿色', 'C. 黑色', 'D. 黄色'], answer: 'B', explanation: '苹果通常是红色或绿色的。', createdAt: '2026-01-01' },
        { id: 'q-science-1-003', subject: 'science', grade: 1, knowledgePoint: '自然', difficulty: 1, type: 'choice', content: '太阳是什么形状的？', options: ['A. 方形', 'B. 三角形', 'C. 圆形', 'D. 星形'], answer: 'C', explanation: '太阳是圆形的。', createdAt: '2026-01-01' },
        { id: 'q-science-1-004', subject: 'science', grade: 1, knowledgePoint: '天气', difficulty: 2, type: 'choice', content: '下雨天需要用什么？', options: ['A. 太阳镜', 'B. 雨伞', 'C. 冰鞋', 'D. 泳镜'], answer: 'B', explanation: '下雨天需要用雨伞挡雨。', createdAt: '2026-01-01' },
        { id: 'q-science-1-005', subject: 'science', grade: 1, knowledgePoint: '季节', difficulty: 2, type: 'choice', content: '冬天很冷，我们需要穿什么？', options: ['A. 短袖', 'B. 短裤', 'C. 棉衣', 'D. 凉鞋'], answer: 'C', explanation: '冬天冷，需要穿棉衣保暖。', createdAt: '2026-01-01' },

        // ===== 二年级题目 =====
        // 二年级数学
        { id: 'q-math-2-001', subject: 'math', grade: 2, knowledgePoint: '加法', difficulty: 1, type: 'choice', content: '5 + 3 = ?', options: ['A. 6', 'B. 7', 'C. 8', 'D. 9'], answer: 'C', explanation: '5 + 3 = 8。', createdAt: '2026-01-01' },
        { id: 'q-math-2-002', subject: 'math', grade: 2, knowledgePoint: '减法', difficulty: 1, type: 'choice', content: '10 - 4 = ?', options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'], answer: 'B', explanation: '10 - 4 = 6。', createdAt: '2026-01-01' },
        { id: 'q-math-2-003', subject: 'math', grade: 2, knowledgePoint: '进位加法', difficulty: 2, type: 'choice', content: '28 + 5 = ?', options: ['A. 32', 'B. 33', 'C. 34', 'D. 35'], answer: 'B', explanation: '28 + 5 = 33。', createdAt: '2026-01-01' },
        { id: 'q-math-2-004', subject: 'math', grade: 2, knowledgePoint: '退位减法', difficulty: 2, type: 'choice', content: '35 - 8 = ?', options: ['A. 25', 'B. 26', 'C. 27', 'D. 28'], answer: 'C', explanation: '35 - 8 = 27。', createdAt: '2026-01-01' },
        { id: 'q-math-2-005', subject: 'math', grade: 2, knowledgePoint: '比较大小', difficulty: 2, type: 'choice', content: '下面哪个数最大？', options: ['A. 45', 'B. 54', 'C. 44', 'D. 55'], answer: 'D', explanation: '比较这四个数字，55最大。', createdAt: '2026-01-01' },
        // 二年级语文
        { id: 'q-chinese-2-001', subject: 'chinese', grade: 2, knowledgePoint: '拼音', difficulty: 1, type: 'choice', content: '"春天"的拼音是？', options: ['A. chūn tiān', 'B. chūn tián', 'C. chún tiān', 'D. chún tián'], answer: 'A', explanation: '"春天"的拼音是chūn tiān。', createdAt: '2026-01-01' },
        { id: 'q-chinese-2-002', subject: 'chinese', grade: 2, knowledgePoint: '汉字', difficulty: 1, type: 'choice', content: '"山"有几笔？', options: ['A. 2笔', 'B. 3笔', 'C. 4笔', 'D. 5笔'], answer: 'B', explanation: '"山"有3笔。', createdAt: '2026-01-01' },
        { id: 'q-chinese-2-003', subject: 'chinese', grade: 2, knowledgePoint: '词语', difficulty: 2, type: 'choice', content: '"高兴"的意思是？', options: ['A. 开心', 'B. 伤心', 'C. 生气', 'D. 紧张'], answer: 'A', explanation: '"高兴"的意思是开心。', createdAt: '2026-01-01' },
        { id: 'q-chinese-2-004', subject: 'chinese', grade: 2, knowledgePoint: '反义词', difficulty: 2, type: 'choice', content: '"大"的反义词是？', options: ['A. 高', 'B. 小', 'C. 长', 'D. 多'], answer: 'B', explanation: '"大"的反义词是"小"。', createdAt: '2026-01-01' },
        { id: 'q-chinese-2-005', subject: 'chinese', grade: 2, knowledgePoint: '句子', difficulty: 3, type: 'choice', content: '下面哪个句子是正确的？', options: ['A. 我吃饭', 'B. 吃饭我', 'C. 饭吃我', 'D. 吃我饭'], answer: 'A', explanation: '正确的句子顺序是"我吃饭"。', createdAt: '2026-01-01' },
        // 二年级英语
        { id: 'q-english-2-001', subject: 'english', grade: 2, knowledgePoint: '问候', difficulty: 1, type: 'choice', content: '"Hello"的意思是？', options: ['A. 再见', 'B. 你好', 'C. 谢谢', 'D. 对不起'], answer: 'B', explanation: 'Hello的意思是你好。', createdAt: '2026-01-01' },
        { id: 'q-english-2-002', subject: 'english', grade: 2, knowledgePoint: '问候', difficulty: 1, type: 'choice', content: '"Goodbye"的意思是？', options: ['A. 你好', 'B. 再见', 'C. 谢谢', 'D. 早上好'], answer: 'B', explanation: 'Goodbye的意思是再见。', createdAt: '2026-01-01' },
        { id: 'q-english-2-003', subject: 'english', grade: 2, knowledgePoint: '数字', difficulty: 2, type: 'choice', content: '"one"的意思是？', options: ['A. 二', 'B. 一', 'C. 三', 'D. 四'], answer: 'B', explanation: 'one的意思是一。', createdAt: '2026-01-01' },
        { id: 'q-english-2-004', subject: 'english', grade: 2, knowledgePoint: '数字', difficulty: 2, type: 'choice', content: '"three"的意思是？', options: ['A. 二', 'B. 三', 'C. 四', 'D. 五'], answer: 'B', explanation: 'three的意思是三。', createdAt: '2026-01-01' },
        { id: 'q-english-2-005', subject: 'english', grade: 2, knowledgePoint: '家庭', difficulty: 2, type: 'choice', content: '"mother"的意思是？', options: ['A. 爸爸', 'B. 妈妈', 'C. 姐姐', 'D. 哥哥'], answer: 'B', explanation: 'mother的意思是妈妈。', createdAt: '2026-01-01' },
        // 二年级科学
        { id: 'q-science-2-001', subject: 'science', grade: 2, knowledgePoint: '动物', difficulty: 1, type: 'choice', content: '鱼生活在哪里？', options: ['A. 天空', 'B. 水里', 'C. 地上', 'D. 树上'], answer: 'B', explanation: '鱼生活在水里。', createdAt: '2026-01-01' },
        { id: 'q-science-2-002', subject: 'science', grade: 2, knowledgePoint: '植物', difficulty: 1, type: 'choice', content: '植物需要什么才能生长？', options: ['A. 黑暗', 'B. 冰块', 'C. 阳光和水', 'D. 沙子'], answer: 'C', explanation: '植物需要阳光和水才能生长。', createdAt: '2026-01-01' },
        { id: 'q-science-2-003', subject: 'science', grade: 2, knowledgePoint: '影子', difficulty: 2, type: 'choice', content: '影子是怎么产生的？', options: ['A. 光被遮挡', 'B. 风吹', 'C. 下雨', 'D. 声音'], answer: 'A', explanation: '当光被物体遮挡时会产生影子。', createdAt: '2026-01-01' },
        { id: 'q-science-2-004', subject: 'science', grade: 2, knowledgePoint: '声音', difficulty: 2, type: 'choice', content: '我们能听到声音是因为？', options: ['A. 看到', 'B. 耳朵听到', 'C. 手摸到', 'D. 嗅到'], answer: 'B', explanation: '我们用耳朵听到声音。', createdAt: '2026-01-01' },
        { id: 'q-science-2-005', subject: 'science', grade: 2, knowledgePoint: '身体', difficulty: 2, type: 'choice', content: '我们用什么看东西？', options: ['A. 耳朵', 'B. 手', 'C. 眼睛', 'D. 嘴'], answer: 'C', explanation: '我们用眼睛看东西。', createdAt: '2026-01-01' },

        // ===== 三年级题目 =====
        // 三年级数学
        { id: 'q-math-3-001', subject: 'math', grade: 3, knowledgePoint: '加法运算', difficulty: 1, type: 'choice', content: '小明有5个苹果，妈妈又给了他3个，小明现在有多少个苹果？', options: ['A. 7个', 'B. 8个', 'C. 9个', 'D. 6个'], answer: 'B', explanation: '5 + 3 = 8，所以小明现在有8个苹果。', createdAt: '2026-01-01' },
        { id: 'q-math-3-002', subject: 'math', grade: 3, knowledgePoint: '乘法口诀', difficulty: 2, type: 'choice', content: '3 × 4 = ?', options: ['A. 10', 'B. 11', 'C. 12', 'D. 13'], answer: 'C', explanation: '3 × 4 = 12。', createdAt: '2026-01-01' },
        { id: 'q-math-3-003', subject: 'math', grade: 3, knowledgePoint: '乘法口诀', difficulty: 2, type: 'choice', content: '5 × 6 = ?', options: ['A. 25', 'B. 30', 'C. 35', 'D. 40'], answer: 'B', explanation: '5 × 6 = 30。', createdAt: '2026-01-01' },
        { id: 'q-math-3-004', subject: 'math', grade: 3, knowledgePoint: '除法', difficulty: 3, type: 'choice', content: '12 ÷ 4 = ?', options: ['A. 2', 'B. 3', 'C. 4', 'D. 6'], answer: 'B', explanation: '12 ÷ 4 = 3。', createdAt: '2026-01-01' },
        { id: 'q-math-3-005', subject: 'math', grade: 3, knowledgePoint: '除法', difficulty: 3, type: 'choice', content: '把18个苹果平均分给3个小朋友，每人分到几个？', options: ['A. 5个', 'B. 6个', 'C. 7个', 'D. 9个'], answer: 'B', explanation: '18 ÷ 3 = 6，每人分到6个苹果。', createdAt: '2026-01-01' },
        // 三年级语文
        { id: 'q-chinese-3-001', subject: 'chinese', grade: 3, knowledgePoint: '拼音', difficulty: 1, type: 'choice', content: '"你好"的拼音是？', options: ['A. nǐ hǎo', 'B. nǐ háo', 'C. nì hǎo', 'D. nì háo'], answer: 'A', explanation: '"你好"的标准拼音是 nǐ hǎo。', createdAt: '2026-01-01' },
        { id: 'q-chinese-3-002', subject: 'chinese', grade: 3, knowledgePoint: '词语', difficulty: 2, type: 'choice', content: '"美丽"的意思是？', options: ['A. 丑陋', 'B. 好看', 'C. 奇怪', 'D. 普通'], answer: 'B', explanation: '"美丽"的意思是好看、漂亮。', createdAt: '2026-01-01' },
        { id: 'q-chinese-3-003', subject: 'chinese', grade: 3, knowledgePoint: '成语', difficulty: 2, type: 'choice', content: '"一心一意"的意思是？', options: ['A. 专心致志', 'B. 心不在焉', 'C. 三心二意', 'D. 心口不一'], answer: 'A', explanation: '"一心一意"的意思是专心致志，做事专注。', createdAt: '2026-01-01' },
        { id: 'q-chinese-3-004', subject: 'chinese', grade: 3, knowledgePoint: '阅读理解', difficulty: 3, type: 'choice', content: '"春天来了，花儿开了。"这句话描写的是什么季节？', options: ['A. 夏天', 'B. 秋天', 'C. 冬天', 'D. 春天'], answer: 'D', explanation: '这句话明确写了"春天来了"，描写的季节是春天。', createdAt: '2026-01-01' },
        { id: 'q-chinese-3-005', subject: 'chinese', grade: 3, knowledgePoint: '句子', difficulty: 3, type: 'choice', content: '下面哪个句子是问句？', options: ['A. 今天天气很好', 'B. 你好吗？', 'C. 我很开心', 'D. 他去上学'], answer: 'B', explanation: '有问号的句子是问句，"你好吗？"是问句。', createdAt: '2026-01-01' },
        // 三年级英语
        { id: 'q-english-3-001', subject: 'english', grade: 3, knowledgePoint: '单词', difficulty: 1, type: 'choice', content: '"apple"的中文意思是？', options: ['A. 苹果', 'B. 橘子', 'C. 香蕉', 'D. 草莓'], answer: 'A', explanation: 'apple的中文意思是苹果。', createdAt: '2026-01-01' },
        { id: 'q-english-3-002', subject: 'english', grade: 3, knowledgePoint: '单词', difficulty: 1, type: 'choice', content: '"book"的中文意思是？', options: ['A. 笔', 'B. 书', 'C. 纸', 'D. 桌子'], answer: 'B', explanation: 'book的中文意思是书。', createdAt: '2026-01-01' },
        { id: 'q-english-3-003', subject: 'english', grade: 3, knowledgePoint: '句型', difficulty: 2, type: 'choice', content: '"What is your name?"的意思是？', options: ['A. 你好吗', 'B. 你叫什么名字', 'C. 你几岁了', 'D. 你在哪'], answer: 'B', explanation: 'What is your name?的意思是你叫什么名字。', createdAt: '2026-01-01' },
        { id: 'q-english-3-004', subject: 'english', grade: 3, knowledgePoint: '句型', difficulty: 2, type: 'choice', content: '"I am seven years old."的意思是？', options: ['A. 我叫小明', 'B. 我七岁了', 'C. 我很开心', 'D. 我在学校'], answer: 'B', explanation: 'I am seven years old的意思是我七岁了。', createdAt: '2026-01-01' },
        { id: 'q-english-3-005', subject: 'english', grade: 3, knowledgePoint: '语法', difficulty: 3, type: 'choice', content: '用英语表达"这是一只猫"，应该说：', options: ['A. This is a cat.', 'B. This is cat.', 'C. Is this a cat.', 'D. This are a cat.'], answer: 'A', explanation: '正确的表达是"This is a cat."，需要加上冠词a。', createdAt: '2026-01-01' },
        // 三年级科学
        { id: 'q-science-3-001', subject: 'science', grade: 3, knowledgePoint: '植物', difficulty: 1, type: 'choice', content: '植物的主要颜色是什么？', options: ['A. 红色', 'B. 绿色', 'C. 蓝色', 'D. 黄色'], answer: 'B', explanation: '植物叶子主要含有叶绿素，呈现绿色。', createdAt: '2026-01-01' },
        { id: 'q-science-3-002', subject: 'science', grade: 3, knowledgePoint: '动物', difficulty: 1, type: 'choice', content: '蝴蝶是什么类型的动物？', options: ['A. 鱼类', 'B. 昆虫', 'C. 哺乳动物', 'D. 鸟类'], answer: 'B', explanation: '蝴蝶是昆虫。', createdAt: '2026-01-01' },
        { id: 'q-science-3-003', subject: 'science', grade: 3, knowledgePoint: '植物生长', difficulty: 2, type: 'choice', content: '植物生长需要什么？', options: ['A. 阳光、水和土壤', 'B. 只有水', 'C. 只有阳光', 'D. 只有土壤'], answer: 'A', explanation: '植物生长需要阳光、水和土壤。', createdAt: '2026-01-01' },
        { id: 'q-science-3-004', subject: 'science', grade: 3, knowledgePoint: '光合作用', difficulty: 3, type: 'choice', content: '植物通过什么过程制造食物？', options: ['A. 呼吸', 'B. 光合作用', 'C. 吃东西', 'D. 睡觉'], answer: 'B', explanation: '植物通过光合作用制造食物。', createdAt: '2026-01-01' },
        { id: 'q-science-3-005', subject: 'science', grade: 3, knowledgePoint: '自然现象', difficulty: 3, type: 'choice', content: '彩虹是怎么形成的？', options: ['A. 下雨', 'B. 阳光照射雨滴', 'C. 风吹', 'D. 云朵'], answer: 'B', explanation: '彩虹是阳光照射雨滴形成的。', createdAt: '2026-01-01' },

        // ===== 四年级题目 =====
        // 四年级数学
        { id: 'q-math-4-001', subject: 'math', grade: 4, knowledgePoint: '减法运算', difficulty: 2, type: 'choice', content: '一本书有100页，小明已经看了25页，还剩多少页没看？', options: ['A. 75页', 'B. 65页', 'C. 85页', 'D. 55页'], answer: 'A', explanation: '100 - 25 = 75，所以还剩75页没看。', createdAt: '2026-01-01' },
        { id: 'q-math-4-002', subject: 'math', grade: 4, knowledgePoint: '乘法', difficulty: 2, type: 'choice', content: '23 × 4 = ?', options: ['A. 82', 'B. 92', 'C. 86', 'D. 96'], answer: 'B', explanation: '23 × 4 = 92。', createdAt: '2026-01-01' },
        { id: 'q-math-4-003', subject: 'math', grade: 4, knowledgePoint: '除法', difficulty: 2, type: 'choice', content: '96 ÷ 8 = ?', options: ['A. 10', 'B. 11', 'C. 12', 'D. 13'], answer: 'C', explanation: '96 ÷ 8 = 12。', createdAt: '2026-01-01' },
        { id: 'q-math-4-004', subject: 'math', grade: 4, knowledgePoint: '四则运算', difficulty: 3, type: 'choice', content: '12 + 8 × 3 = ?', options: ['A. 36', 'B. 60', 'C. 30', 'D. 36'], answer: 'D', explanation: '先算乘法：8 × 3 = 24，再算加法：12 + 24 = 36。', createdAt: '2026-01-01' },
        { id: 'q-math-4-005', subject: 'math', grade: 4, knowledgePoint: '应用题', difficulty: 3, type: 'choice', content: '小明买了5支笔，每支3元，一共花了多少元？', options: ['A. 10元', 'B. 15元', 'C. 20元', 'D. 25元'], answer: 'B', explanation: '5 × 3 = 15元。', createdAt: '2026-01-01' },
        // 四年级语文
        { id: 'q-chinese-4-001', subject: 'chinese', grade: 4, knowledgePoint: '成语', difficulty: 2, type: 'choice', content: '"画蛇添足"的意思是？', options: ['A. 做事多余', 'B. 做事太少', 'C. 做事认真', 'D. 做事很快'], answer: 'A', explanation: '"画蛇添足"的意思是做事多余，多此一举。', createdAt: '2026-01-01' },
        { id: 'q-chinese-4-002', subject: 'chinese', grade: 4, knowledgePoint: '成语', difficulty: 2, type: 'choice', content: '"守株待兔"告诉我们什么道理？', options: ['A. 努力才能成功', 'B. 等待就能成功', 'C. 运气最重要', 'D. 不需要努力'], answer: 'A', explanation: '"守株待兔"告诉我们不能等待运气，要努力才能成功。', createdAt: '2026-01-01' },
        { id: 'q-chinese-4-003', subject: 'chinese', grade: 4, knowledgePoint: '修辞', difficulty: 3, type: 'choice', content: '"太阳像一个大火球"用了什么修辞手法？', options: ['A. 比喻', 'B. 夸张', 'C. 拟人', 'D. 排比'], answer: 'A', explanation: '这句话把太阳比作大火球，是比喻手法。', createdAt: '2026-01-01' },
        { id: 'q-chinese-4-004', subject: 'chinese', grade: 4, knowledgePoint: '作文', difficulty: 3, type: 'choice', content: '写记叙文应该包含哪些要素？', options: ['A. 时间、地点、人物、事情', 'B. 只有时间', 'C. 只有地点', 'D. 只有人物'], answer: 'A', explanation: '记叙文应包含时间、地点、人物、事情的起因、经过、结果。', createdAt: '2026-01-01' },
        { id: 'q-chinese-4-005', subject: 'chinese', grade: 4, knowledgePoint: '古诗词', difficulty: 4, type: 'choice', content: '"床前明月光"出自哪首诗？', options: ['A. 《静夜思》', 'B. 《春晓》', 'C. 《悯农》', 'D. 《咏鹅》'], answer: 'A', explanation: '"床前明月光"出自李白的《静夜思》。', createdAt: '2026-01-01' },
        // 四年级英语
        { id: 'q-english-4-001', subject: 'english', grade: 4, knowledgePoint: '语法', difficulty: 2, type: 'choice', content: 'I ___ a student.', options: ['A. am', 'B. is', 'C. are', 'D. be'], answer: 'A', explanation: '主语I（我）后面用am，所以是"I am a student"。', createdAt: '2026-01-01' },
        { id: 'q-english-4-002', subject: 'english', grade: 4, knowledgePoint: '语法', difficulty: 2, type: 'choice', content: 'She ___ a teacher.', options: ['A. am', 'B. is', 'C. are', 'D. be'], answer: 'B', explanation: '主语She（她）是第三人称单数，后面用is。', createdAt: '2026-01-01' },
        { id: 'q-english-4-003', subject: 'english', grade: 4, knowledgePoint: '句型', difficulty: 3, type: 'choice', content: '"Where are you from?"的意思是？', options: ['A. 你叫什么名字', 'B. 你来自哪里', 'C. 你几岁了', 'D. 你在哪'], answer: 'B', explanation: 'Where are you from?的意思是你来自哪里。', createdAt: '2026-01-01' },
        { id: 'q-english-4-004', subject: 'english', grade: 4, knowledgePoint: '时态', difficulty: 3, type: 'choice', content: '"I am reading a book."表示什么时态？', options: ['A. 一般现在时', 'B. 现在进行时', 'C. 一般过去时', 'D. 一般将来时'], answer: 'B', explanation: 'am reading表示正在进行的动作，是现在进行时。', createdAt: '2026-01-01' },
        { id: 'q-english-4-005', subject: 'english', grade: 4, knowledgePoint: '词汇', difficulty: 3, type: 'choice', content: '"happy"的反义词是？', options: ['A. sad', 'B. angry', 'C. tired', 'D. hungry'], answer: 'A', explanation: 'happy（开心）的反义词是sad（伤心）。', createdAt: '2026-01-01' },
        // 四年级科学
        { id: 'q-science-4-001', subject: 'science', grade: 4, knowledgePoint: '实验', difficulty: 1, type: 'choice', content: '做科学实验时应该注意什么？', options: ['A. 随意操作', 'B. 按步骤安全操作', 'C. 不需要记录', 'D. 可以独自做'], answer: 'B', explanation: '做实验时要按步骤安全操作。', createdAt: '2026-01-01' },
        { id: 'q-science-4-002', subject: 'science', grade: 4, knowledgePoint: '物质', difficulty: 2, type: 'choice', content: '水在什么温度会结冰？', options: ['A. 10°C', 'B. 5°C', 'C. 0°C', 'D. 100°C'], answer: 'C', explanation: '水在0°C时会结冰。', createdAt: '2026-01-01' },
        { id: 'q-science-4-003', subject: 'science', grade: 4, knowledgePoint: '物质变化', difficulty: 2, type: 'choice', content: '冰融化成水是什么变化？', options: ['A. 化学变化', 'B. 物理变化', 'C. 不可逆变化', 'D. 神奇变化'], answer: 'B', explanation: '冰融化成水是物理变化，只是状态改变。', createdAt: '2026-01-01' },
        { id: 'q-science-4-004', subject: 'science', grade: 4, knowledgePoint: '实验方法', difficulty: 3, type: 'choice', content: '科学实验需要什么步骤？', options: ['A. 提问、假设、实验、结论', 'B. 直接做', 'C. 只看结果', 'D. 不需要思考'], answer: 'A', explanation: '科学实验需要提问、假设、实验、记录、得出结论。', createdAt: '2026-01-01' },
        { id: 'q-science-4-005', subject: 'science', grade: 4, knowledgePoint: '观察', difficulty: 3, type: 'choice', content: '观察植物生长应该记录什么？', options: ['A. 只记录颜色', 'B. 高度、叶子数量等变化', 'C. 只记录名字', 'D. 不需要记录'], answer: 'B', explanation: '观察植物应记录高度、叶子数量等变化。', createdAt: '2026-01-01' },

        // ===== 五年级题目 =====
        // 五年级数学
        { id: 'q-math-5-001', subject: 'math', grade: 5, knowledgePoint: '乘法运算', difficulty: 3, type: 'choice', content: '小明买了3盒铅笔，每盒有12支，小明一共买了多少支铅笔？', options: ['A. 36支', 'B. 35支', 'C. 24支', 'D. 15支'], answer: 'A', explanation: '3 × 12 = 36，所以小明一共买了36支铅笔。', createdAt: '2026-01-01' },
        { id: 'q-math-5-002', subject: 'math', grade: 5, knowledgePoint: '小数', difficulty: 2, type: 'choice', content: '0.5等于几分之几？', options: ['A. 1/3', 'B. 1/2', 'C. 1/4', 'D. 1/5'], answer: 'B', explanation: '0.5 = 1/2，即一半。', createdAt: '2026-01-01' },
        { id: 'q-math-5-003', subject: 'math', grade: 5, knowledgePoint: '分数', difficulty: 2, type: 'choice', content: '1/4 + 1/4 = ?', options: ['A. 1/8', 'B. 1/2', 'C. 2/4', 'D. 1/4'], answer: 'C', explanation: '1/4 + 1/4 = 2/4 = 1/2。', createdAt: '2026-01-01' },
        { id: 'q-math-5-004', subject: 'math', grade: 5, knowledgePoint: '小数运算', difficulty: 3, type: 'choice', content: '2.5 + 1.3 = ?', options: ['A. 3.5', 'B. 3.8', 'C. 4.8', 'D. 2.8'], answer: 'B', explanation: '2.5 + 1.3 = 3.8。', createdAt: '2026-01-01' },
        { id: 'q-math-5-005', subject: 'math', grade: 5, knowledgePoint: '应用题', difficulty: 4, type: 'choice', content: '一块蛋糕分给4个人，每人分到几分之几？', options: ['A. 1/2', 'B. 1/3', 'C. 1/4', 'D. 1/5'], answer: 'C', explanation: '把蛋糕分成4份，每人分到1/4。', createdAt: '2026-01-01' },
        // 五年级语文
        { id: 'q-chinese-5-001', subject: 'chinese', grade: 5, knowledgePoint: '古诗词', difficulty: 2, type: 'choice', content: '"春眠不觉晓"出自哪首诗？', options: ['A. 《静夜思》', 'B. 《春晓》', 'C. 《悯农》', 'D. 《咏鹅》'], answer: 'B', explanation: '"春眠不觉晓"出自孟浩然的《春晓》。', createdAt: '2026-01-01' },
        { id: 'q-chinese-5-002', subject: 'chinese', grade: 5, knowledgePoint: '古诗词', difficulty: 3, type: 'choice', content: '"举头望明月，低头思故乡"表达了什么情感？', options: ['A. 开心', 'B. 思念故乡', 'C. 生气', 'D. 紧张'], answer: 'B', explanation: '这句诗表达了诗人思念故乡的情感。', createdAt: '2026-01-01' },
        { id: 'q-chinese-5-003', subject: 'chinese', grade: 5, knowledgePoint: '成语', difficulty: 3, type: 'choice', content: '"愚公移山"告诉我们什么道理？', options: ['A. 放弃', 'B. 坚持不懈', 'C. 做事要快', 'D. 不需要努力'], answer: 'B', explanation: '"愚公移山"告诉我们做事要坚持不懈。', createdAt: '2026-01-01' },
        { id: 'q-chinese-5-004', subject: 'chinese', grade: 5, knowledgePoint: '修辞', difficulty: 3, type: 'choice', content: '"小鸟在唱歌"用了什么修辞手法？', options: ['A. 比喻', 'B. 拟人', 'C. 夸张', 'D. 排比'], answer: 'B', explanation: '把小鸟比作人唱歌，是拟人手法。', createdAt: '2026-01-01' },
        { id: 'q-chinese-5-005', subject: 'chinese', grade: 5, knowledgePoint: '阅读', difficulty: 4, type: 'choice', content: '理解文章主题应该注意什么？', options: ['A. 只看标题', 'B. 理解主要内容', 'C. 只看结尾', 'D. 不需要思考'], answer: 'B', explanation: '理解文章主题要把握主要内容，结合全文分析。', createdAt: '2026-01-01' },
        // 五年级英语
        { id: 'q-english-5-001', subject: 'english', grade: 5, knowledgePoint: '时态', difficulty: 2, type: 'choice', content: '"I play football every day."表示什么时态？', options: ['A. 一般现在时', 'B. 现在进行时', 'C. 一般过去时', 'D. 一般将来时'], answer: 'A', explanation: 'every day表示经常性的动作，是一般现在时。', createdAt: '2026-01-01' },
        { id: 'q-english-5-002', subject: 'english', grade: 5, knowledgePoint: '时态', difficulty: 3, type: 'choice', content: '"I played football yesterday."表示什么时态？', options: ['A. 一般现在时', 'B. 现在进行时', 'C. 一般过去时', 'D. 一般将来时'], answer: 'C', explanation: 'yesterday表示过去的时间，play变成played，是一般过去时。', createdAt: '2026-01-01' },
        { id: 'q-english-5-003', subject: 'english', grade: 5, knowledgePoint: '动词变化', difficulty: 3, type: 'choice', content: 'go的过去式是？', options: ['A. goed', 'B. went', 'C. goes', 'D. going'], answer: 'B', explanation: 'go的过去式是went（不规则变化）。', createdAt: '2026-01-01' },
        { id: 'q-english-5-004', subject: 'english', grade: 5, knowledgePoint: '句型', difficulty: 3, type: 'choice', content: '"What did you do yesterday?"的意思是？', options: ['A. 你今天做什么', 'B. 你昨天做什么了', 'C. 你明天做什么', 'D. 你现在做什么'], answer: 'B', explanation: 'What did you do yesterday?的意思是你昨天做什么了。', createdAt: '2026-01-01' },
        { id: 'q-english-5-005', subject: 'english', grade: 5, knowledgePoint: '词汇', difficulty: 4, type: 'choice', content: '"interesting"的意思是？', options: ['A. 有趣的', 'B. 无聊的', 'C. 困难的', 'D. 简单的'], answer: 'A', explanation: 'interesting的意思是有趣的。', createdAt: '2026-01-01' },
        // 五年级科学
        { id: 'q-science-5-001', subject: 'science', grade: 5, knowledgePoint: '人体', difficulty: 2, type: 'choice', content: '人体最大的器官是什么？', options: ['A. 心脏', 'B. 肝脏', 'C. 皮肤', 'D. 大脑'], answer: 'C', explanation: '皮肤是人体最大的器官。', createdAt: '2026-01-01' },
        { id: 'q-science-5-002', subject: 'science', grade: 5, knowledgePoint: '人体系统', difficulty: 2, type: 'choice', content: '心脏属于什么系统？', options: ['A. 消化系统', 'B. 呼吸系统', 'C. 循环系统', 'D. 神经系统'], answer: 'C', explanation: '心脏属于循环系统，负责血液循环。', createdAt: '2026-01-01' },
        { id: 'q-science-5-003', subject: 'science', grade: 5, knowledgePoint: '生态系统', difficulty: 3, type: 'choice', content: '生态系统包括哪些部分？', options: ['A. 只有动物', 'B. 只有植物', 'C. 生物和环境', 'D. 只有水'], answer: 'C', explanation: '生态系统包括生物和环境两部分。', createdAt: '2026-01-01' },
        { id: 'q-science-5-004', subject: 'science', grade: 5, knowledgePoint: '食物链', difficulty: 3, type: 'choice', content: '在食物链"草→兔子→狼"中，狼是什么？', options: ['A. 生产者', 'B. 消费者', 'C. 分解者', 'D. 植物'], answer: 'B', explanation: '狼吃兔子，是消费者。', createdAt: '2026-01-01' },
        { id: 'q-science-5-005', subject: 'science', grade: 5, knowledgePoint: 'AI', difficulty: 4, type: 'choice', content: '人工智能（AI）是什么？', options: ['A. 一种动物', 'B. 让机器像人一样思考的技术', 'C. 一种植物', 'D. 一种食物'], answer: 'B', explanation: '人工智能是让机器像人一样思考和学习的技术。', createdAt: '2026-01-01' },

        // ===== 六年级题目 =====
        // 六年级数学
        { id: 'q-math-6-001', subject: 'math', grade: 6, knowledgePoint: '比例', difficulty: 2, type: 'choice', content: '如果2:3 = 4:x，那么x等于？', options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'], answer: 'B', explanation: '2/3 = 4/x，解得x = 6。', createdAt: '2026-01-01' },
        { id: 'q-math-6-002', subject: 'math', grade: 6, knowledgePoint: '百分数', difficulty: 2, type: 'choice', content: '50%等于几分之几？', options: ['A. 1/3', 'B. 1/2', 'C. 1/4', 'D. 1/5'], answer: 'B', explanation: '50% = 50/100 = 1/2。', createdAt: '2026-01-01' },
        { id: 'q-math-6-003', subject: 'math', grade: 6, knowledgePoint: '百分数应用', difficulty: 3, type: 'choice', content: '一件衣服原价100元，打8折后多少钱？', options: ['A. 70元', 'B. 80元', 'C. 90元', 'D. 60元'], answer: 'B', explanation: '100 × 80% = 80元。', createdAt: '2026-01-01' },
        { id: 'q-math-6-004', subject: 'math', grade: 6, knowledgePoint: '圆', difficulty: 3, type: 'choice', content: '圆的周长公式是？', options: ['A. πr', 'B. 2πr', 'C. πr²', 'D. 2r'], answer: 'B', explanation: '圆的周长公式是C = 2πr（或C = πd）。', createdAt: '2026-01-01' },
        { id: 'q-math-6-005', subject: 'math', grade: 6, knowledgePoint: '圆面积', difficulty: 4, type: 'choice', content: '圆的面积公式是？', options: ['A. πr', 'B. 2πr', 'C. πr²', 'D. 2r²'], answer: 'C', explanation: '圆的面积公式是S = πr²。', createdAt: '2026-01-01' },
        // 六年级语文
        { id: 'q-chinese-6-001', subject: 'chinese', grade: 6, knowledgePoint: '文言文', difficulty: 3, type: 'choice', content: '"学而时习之"中"习"的意思是？', options: ['A. 玩耍', 'B. 温习、练习', 'C. 吃饭', 'D. 睡觉'], answer: 'B', explanation: '"习"在这里的意思是温习、练习。', createdAt: '2026-01-01' },
        { id: 'q-chinese-6-002', subject: 'chinese', grade: 6, knowledgePoint: '文言文', difficulty: 3, type: 'choice', content: '"三人行，必有我师焉"出自哪里？', options: ['A. 《论语》', 'B. 《孟子》', 'C. 《老子》', 'D. 《庄子》'], answer: 'A', explanation: '这句话出自《论语》。', createdAt: '2026-01-01' },
        { id: 'q-chinese-6-003', subject: 'chinese', grade: 6, knowledgePoint: '古诗词', difficulty: 4, type: 'choice', content: '"但愿人长久，千里共婵娟"中"婵娟"指的是？', options: ['A. 太阳', 'B. 月亮', 'C. 星星', 'D. 云'], answer: 'B', explanation: '"婵娟"在这里指的是月亮。', createdAt: '2026-01-01' },
        { id: 'q-chinese-6-004', subject: 'chinese', grade: 6, knowledgePoint: '修辞', difficulty: 4, type: 'choice', content: '"飞流直下三千尺"用了什么修辞？', options: ['A. 比喻', 'B. 夸张', 'C. 拟人', 'D. 排比'], answer: 'B', explanation: '用"三千尺"夸张地描写瀑布的高度。', createdAt: '2026-01-01' },
        { id: 'q-chinese-6-005', subject: 'chinese', grade: 6, knowledgePoint: '作文', difficulty: 4, type: 'choice', content: '写议论文需要什么要素？', options: ['A. 论点、论据、论证', 'B. 只有论点', 'C. 只有论据', 'D. 只有时间'], answer: 'A', explanation: '议论文需要论点（观点）、论据（证据）、论证（推理）。', createdAt: '2026-01-01' },
        // 六年级英语
        { id: 'q-english-6-001', subject: 'english', grade: 6, knowledgePoint: '过去时', difficulty: 2, type: 'choice', content: '"I went to school yesterday."中went的原形是？', options: ['A. go', 'B. goes', 'C. going', 'D. goed'], answer: 'A', explanation: 'went是go的过去式，原形是go。', createdAt: '2026-01-01' },
        { id: 'q-english-6-002', subject: 'english', grade: 6, knowledgePoint: '过去时', difficulty: 3, type: 'choice', content: 'buy的过去式是？', options: ['A. buyed', 'B. bought', 'C. buys', 'D. buying'], answer: 'B', explanation: 'buy的过去式是bought（不规则变化）。', createdAt: '2026-01-01' },
        { id: 'q-english-6-003', subject: 'english', grade: 6, knowledgePoint: '句型', difficulty: 3, type: 'choice', content: '"Did you play football?"的肯定回答是？', options: ['A. Yes, I do.', 'B. Yes, I did.', 'C. Yes, I am.', 'D. Yes, I will.'], answer: 'B', explanation: '问句用Did提问，回答用Yes, I did。', createdAt: '2026-01-01' },
        { id: 'q-english-6-004', subject: 'english', grade: 6, knowledgePoint: '词汇', difficulty: 4, type: 'choice', content: '"important"的意思是？', options: ['A. 重要的', 'B. 简单的', 'C. 困难的', 'D. 无聊的'], answer: 'A', explanation: 'important的意思是重要的。', createdAt: '2026-01-01' },
        { id: 'q-english-6-005', subject: 'english', grade: 6, knowledgePoint: '写作', difficulty: 4, type: 'choice', content: '写英语作文时，段落之间应该用什么连接？', options: ['A. 不需要连接', 'B. 连接词', 'C. 只用逗号', 'D. 只用句号'], answer: 'B', explanation: '段落之间应该用连接词如first, then, finally等来连接。', createdAt: '2026-01-01' },
        // 六年级科学
        { id: 'q-science-6-001', subject: 'science', grade: 6, knowledgePoint: '地球', difficulty: 2, type: 'choice', content: '地球围绕什么转？', options: ['A. 月亮', 'B. 太阳', 'C. 自己', 'D. 星星'], answer: 'B', explanation: '地球围绕太阳公转。', createdAt: '2026-01-01' },
        { id: 'q-science-6-002', subject: 'science', grade: 6, knowledgePoint: '太阳系', difficulty: 2, type: 'choice', content: '太阳系中最大的行星是？', options: ['A. 地球', 'B. 木星', 'C. 火星', 'D. 金星'], answer: 'B', explanation: '木星是太阳系中最大的行星。', createdAt: '2026-01-01' },
        { id: 'q-science-6-003', subject: 'science', grade: 6, knowledgePoint: '月球', difficulty: 3, type: 'choice', content: '月球围绕什么转？', options: ['A. 太阳', 'B. 地球', 'C. 木星', 'D. 火星'], answer: 'B', explanation: '月球围绕地球公转。', createdAt: '2026-01-01' },
        { id: 'q-science-6-004', subject: 'science', grade: 6, knowledgePoint: '昼夜', difficulty: 3, type: 'choice', content: '地球上的昼夜是怎么形成的？', options: ['A. 地球公转', 'B. 地球自转', 'C. 月亮运动', 'D. 太阳变化'], answer: 'B', explanation: '地球自转形成昼夜，朝向太阳的一面是白天。', createdAt: '2026-01-01' },
        { id: 'q-science-6-005', subject: 'science', grade: 6, knowledgePoint: '四季', difficulty: 4, type: 'choice', content: '地球上的四季是怎么形成的？', options: ['A. 地球自转', 'B. 地球公转和地轴倾斜', 'C. 月亮运动', 'D. 太阳变化'], answer: 'B', explanation: '四季由地球公转和地轴倾斜共同形成。', createdAt: '2026-01-01' },

        // ===== 七年级题目 =====
        // 七年级数学
        { id: 'q-math-7-001', subject: 'math', grade: 7, knowledgePoint: '方程', difficulty: 2, type: 'choice', content: '方程2x + 3 = 7的解是？', options: ['A. x = 1', 'B. x = 2', 'C. x = 3', 'D. x = 4'], answer: 'B', explanation: '2x + 3 = 7，解得2x = 4，x = 2。', createdAt: '2026-01-01' },
        { id: 'q-math-7-002', subject: 'math', grade: 7, knowledgePoint: '方程', difficulty: 3, type: 'choice', content: '方程3x - 5 = 10的解是？', options: ['A. x = 3', 'B. x = 4', 'C. x = 5', 'D. x = 6'], answer: 'C', explanation: '3x - 5 = 10，解得3x = 15，x = 5。', createdAt: '2026-01-01' },
        { id: 'q-math-7-003', subject: 'math', grade: 7, knowledgePoint: '负数', difficulty: 2, type: 'choice', content: '-3 + 5 = ?', options: ['A. -8', 'B. 2', 'C. 8', 'D. -2'], answer: 'B', explanation: '-3 + 5 = 2。', createdAt: '2026-01-01' },
        { id: 'q-math-7-004', subject: 'math', grade: 7, knowledgePoint: '负数', difficulty: 3, type: 'choice', content: '-5 × (-2) = ?', options: ['A. -10', 'B. 10', 'C. -7', 'D. 7'], answer: 'B', explanation: '负数乘负数得正数，-5 × (-2) = 10。', createdAt: '2026-01-01' },
        { id: 'q-math-7-005', subject: 'math', grade: 7, knowledgePoint: '方程应用', difficulty: 4, type: 'choice', content: '小明买了一些笔，每支5元，花了25元，买了几支？', options: ['A. 3支', 'B. 4支', 'C. 5支', 'D. 6支'], answer: 'C', explanation: '设买了x支，5x = 25，x = 5支。', createdAt: '2026-01-01' },
        // 七年级语文
        { id: 'q-chinese-7-001', subject: 'chinese', grade: 7, knowledgePoint: '现代文', difficulty: 2, type: 'choice', content: '阅读理解时，理解文章结构应该注意什么？', options: ['A. 只看开头', 'B. 分析段落关系', 'C. 只看结尾', 'D. 不需要分析'], answer: 'B', explanation: '理解文章结构要分析段落之间的关系和层次。', createdAt: '2026-01-01' },
        { id: 'q-chinese-7-002', subject: 'chinese', grade: 7, knowledgePoint: '文言文', difficulty: 3, type: 'choice', content: '"之"在文言文中常见用法不包括？', options: ['A. 代词', 'B. 助词', 'C. 动词', 'D. 形容词'], answer: 'D', explanation: '"之"常用作代词、助词或动词，不作形容词。', createdAt: '2026-01-01' },
        { id: 'q-chinese-7-003', subject: 'chinese', grade: 7, knowledgePoint: '古诗词', difficulty: 3, type: 'choice', content: '"海内存知己，天涯若比邻"表达了什么？', options: ['A. 孤独', 'B. 友谊珍贵', 'C. 思乡', 'D. 悲伤'], answer: 'B', explanation: '这句话表达了真正的友谊不受距离限制。', createdAt: '2026-01-01' },
        { id: 'q-chinese-7-004', subject: 'chinese', grade: 7, knowledgePoint: '修辞', difficulty: 4, type: 'choice', content: '"山高月小，水落石出"用了什么手法？', options: ['A. 比喻', 'B. 对偶', 'C. 拟人', 'D. 夸张'], answer: 'B', explanation: '这句话上下句结构对称，是对偶手法。', createdAt: '2026-01-01' },
        { id: 'q-chinese-7-005', subject: 'chinese', grade: 7, knowledgePoint: '写作', difficulty: 4, type: 'choice', content: '写作时如何使文章更有说服力？', options: ['A. 只写观点', 'B. 用事实和论据支持', 'C. 只写感受', 'D. 不需要说服'], answer: 'B', explanation: '用事实和论据支持观点，文章更有说服力。', createdAt: '2026-01-01' },
        // 七年级英语
        { id: 'q-english-7-001', subject: 'english', grade: 7, knowledgePoint: '将来时', difficulty: 2, type: 'choice', content: '"I will go to school tomorrow."表示什么时态？', options: ['A. 一般现在时', 'B. 一般过去时', 'C. 一般将来时', 'D. 现在进行时'], answer: 'C', explanation: 'will表示将来，这是一般将来时。', createdAt: '2026-01-01' },
        { id: 'q-english-7-002', subject: 'english', grade: 7, knowledgePoint: '将来时', difficulty: 3, type: 'choice', content: '"I am going to play football."表示什么时态？', options: ['A. 一般现在时', 'B. 一般过去时', 'C. 一般将来时', 'D. 现在进行时'], answer: 'C', explanation: 'be going to表示打算做某事，是一般将来时。', createdAt: '2026-01-01' },
        { id: 'q-english-7-003', subject: 'english', grade: 7, knowledgePoint: '句型', difficulty: 3, type: 'choice', content: '"What will you do tomorrow?"的意思是？', options: ['A. 你今天做什么', 'B. 你明天打算做什么', 'C. 你昨天做什么', 'D. 你现在做什么'], answer: 'B', explanation: 'What will you do tomorrow?的意思是你明天打算做什么。', createdAt: '2026-01-01' },
        { id: 'q-english-7-004', subject: 'english', grade: 7, knowledgePoint: '词汇', difficulty: 4, type: 'choice', content: '"delicious"的意思是？', options: ['A. 好吃的', 'B. 好看的', 'C. 好听的', 'D. 好闻的'], answer: 'A', explanation: 'delicious的意思是美味的、好吃的。', createdAt: '2026-01-01' },
        { id: 'q-english-7-005', subject: 'english', grade: 7, knowledgePoint: '写作', difficulty: 4, type: 'choice', content: '英语作文开头常用的句型是？', options: ['A. In conclusion...', 'B. First of all...', 'C. Therefore...', 'D. However...'], answer: 'B', explanation: 'First of all...常用于开头表示"首先"。', createdAt: '2026-01-01' },
        // 七年级物理
        { id: 'q-physics-7-001', subject: 'physics', grade: 7, knowledgePoint: '声音', difficulty: 2, type: 'choice', content: '声音是怎么产生的？', options: ['A. 物体振动', 'B. 物体静止', 'C. 光照射', 'D. 水流'], answer: 'A', explanation: '声音是由物体振动产生的。', createdAt: '2026-01-01' },
        { id: 'q-physics-7-002', subject: 'physics', grade: 7, knowledgePoint: '声音传播', difficulty: 2, type: 'choice', content: '声音在什么介质中传播最快？', options: ['A. 空气', 'B. 水', 'C. 固体', 'D. 真空'], answer: 'C', explanation: '声音在固体中传播最快，真空不能传声。', createdAt: '2026-01-01' },
        { id: 'q-physics-7-003', subject: 'physics', grade: 7, knowledgePoint: '声音特性', difficulty: 3, type: 'choice', content: '声音的三个特性是？', options: ['A. 音调、响度、音色', 'B. 高度、速度、颜色', 'C. 大小、快慢、形状', 'D. 颜色、温度、湿度'], answer: 'A', explanation: '声音的三个特性是音调、响度、音色。', createdAt: '2026-01-01' },
        { id: 'q-physics-7-004', subject: 'physics', grade: 7, knowledgePoint: '声音频率', difficulty: 4, type: 'choice', content: '频率越高，音调怎么样？', options: ['A. 越低', 'B. 越高', 'C. 不变', 'D. 消失'], answer: 'B', explanation: '频率越高，音调越高。', createdAt: '2026-01-01' },
        { id: 'q-physics-7-005', subject: 'physics', grade: 7, knowledgePoint: '真空', difficulty: 4, type: 'choice', content: '真空能传声吗？', options: ['A. 能', 'B. 不能', 'C. 有时能', 'D. 看情况'], answer: 'B', explanation: '真空没有介质，不能传声。', createdAt: '2026-01-01' },
        // 七年级化学
        { id: 'q-chemistry-7-001', subject: 'chemistry', grade: 7, knowledgePoint: '物质变化', difficulty: 2, type: 'choice', content: '冰融化成水是什么变化？', options: ['A. 化学变化', 'B. 物理变化', 'C. 没有变化', 'D. 神奇变化'], answer: 'B', explanation: '冰融化成水只是状态改变，是物理变化。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-7-002', subject: 'chemistry', grade: 7, knowledgePoint: '化学变化', difficulty: 2, type: 'choice', content: '燃烧是什么变化？', options: ['A. 物理变化', 'B. 化学变化', 'C. 没有变化', 'D. 不确定'], answer: 'B', explanation: '燃烧产生新物质（如二氧化碳、水），是化学变化。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-7-003', subject: 'chemistry', grade: 7, knowledgePoint: '化学变化特征', difficulty: 3, type: 'choice', content: '化学变化的主要特征是？', options: ['A. 形状改变', 'B. 产生新物质', 'C. 颜色改变', 'D. 温度改变'], answer: 'B', explanation: '化学变化的主要特征是产生新物质。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-7-004', subject: 'chemistry', grade: 7, knowledgePoint: '物质性质', difficulty: 3, type: 'choice', content: '颜色、气味、密度属于什么性质？', options: ['A. 化学性质', 'B. 物理性质', 'C. 不重要', 'D. 无意义'], answer: 'B', explanation: '不需要化学变化就能表现的性质是物理性质。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-7-005', subject: 'chemistry', grade: 7, knowledgePoint: '实验', difficulty: 4, type: 'choice', content: '做化学实验时应该注意什么？', options: ['A. 随意操作', 'B. 注意安全、规范操作', 'C. 不用戴眼镜', 'D. 可以吃喝'], answer: 'B', explanation: '做化学实验要注意安全，规范操作，戴护目镜等。', createdAt: '2026-01-01' },
        // 七年级生物
        { id: 'q-biology-7-001', subject: 'biology', grade: 7, knowledgePoint: '细胞', difficulty: 2, type: 'choice', content: '细胞是生命的什么单位？', options: ['A. 最大单位', 'B. 基本单位', 'C. 没有关系', 'D. 不重要'], answer: 'B', explanation: '细胞是生命活动的基本单位。', createdAt: '2026-01-01' },
        { id: 'q-biology-7-002', subject: 'biology', grade: 7, knowledgePoint: '细胞结构', difficulty: 2, type: 'choice', content: '植物细胞和动物细胞的主要区别是？', options: ['A. 植物细胞有叶绿体和细胞壁', 'B. 动物细胞更大', 'C. 植物细胞没有膜', 'D. 没有区别'], answer: 'A', explanation: '植物细胞有叶绿体和细胞壁，动物细胞没有。', createdAt: '2026-01-01' },
        { id: 'q-biology-7-003', subject: 'biology', grade: 7, knowledgePoint: '细胞膜', difficulty: 3, type: 'choice', content: '细胞膜的作用是？', options: ['A. 保护细胞、控制物质进出', 'B. 只是保护', 'C. 没有作用', 'D. 只控制进出'], answer: 'A', explanation: '细胞膜保护细胞并控制物质进出。', createdAt: '2026-01-01' },
        { id: 'q-biology-7-004', subject: 'biology', grade: 7, knowledgePoint: '细胞核', difficulty: 3, type: 'choice', content: '细胞核的作用是？', options: ['A. 只是保护', 'B. 控制细胞生命活动', 'C. 没有作用', 'D. 储存食物'], answer: 'B', explanation: '细胞核是细胞的控制中心，控制生命活动。', createdAt: '2026-01-01' },
        { id: 'q-biology-7-005', subject: 'biology', grade: 7, knowledgePoint: '显微镜', difficulty: 4, type: 'choice', content: '使用显微镜观察细胞的步骤，正确顺序是？', options: ['A. 安放→对光→放片→观察', 'B. 观察→对光→安放→放片', 'C. 放片→安放→对光→观察', 'D. 对光→观察→放片→安放'], answer: 'A', explanation: '正确顺序是安放→对光→放片→观察。', createdAt: '2026-01-01' },

        // ===== 八年级题目 =====
        // 八年级数学
        { id: 'q-math-8-001', subject: 'math', grade: 8, knowledgePoint: '函数', difficulty: 2, type: 'choice', content: '一次函数的一般形式是？', options: ['A. y = kx + b', 'B. y = ax²', 'C. y = k/x', 'D. y = x'], answer: 'A', explanation: '一次函数的一般形式是y = kx + b（k≠0）。', createdAt: '2026-01-01' },
        { id: 'q-math-8-002', subject: 'math', grade: 8, knowledgePoint: '函数图像', difficulty: 3, type: 'choice', content: '函数y = 2x + 1的图像是什么形状？', options: ['A. 曲线', 'B. 直线', 'C. 圆', 'D. 抛物线'], answer: 'B', explanation: '一次函数的图像是一条直线。', createdAt: '2026-01-01' },
        { id: 'q-math-8-003', subject: 'math', grade: 8, knowledgePoint: '勾股定理', difficulty: 3, type: 'choice', content: '勾股定理公式是？', options: ['A. a + b = c', 'B. a² + b² = c²', 'C. a × b = c', 'D. a - b = c'], answer: 'B', explanation: '勾股定理：直角三角形两直角边的平方和等于斜边的平方。', createdAt: '2026-01-01' },
        { id: 'q-math-8-004', subject: 'math', grade: 8, knowledgePoint: '勾股定理应用', difficulty: 4, type: 'choice', content: '直角三角形两边长为3和4，斜边是多少？', options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'], answer: 'A', explanation: '3² + 4² = 9 + 16 = 25 = 5²，斜边是5。', createdAt: '2026-01-01' },
        { id: 'q-math-8-005', subject: 'math', grade: 8, knowledgePoint: '不等式', difficulty: 4, type: 'choice', content: '不等式2x > 6的解是？', options: ['A. x > 2', 'B. x > 3', 'C. x > 4', 'D. x > 5'], answer: 'B', explanation: '2x > 6，解得x > 3。', createdAt: '2026-01-01' },
        // 八年级语文
        { id: 'q-chinese-8-001', subject: 'chinese', grade: 8, knowledgePoint: '议论文', difficulty: 3, type: 'choice', content: '议论文的三要素是？', options: ['A. 论点、论据、论证', 'B. 时间、地点、人物', 'C. 开头、中间、结尾', 'D. 标题、正文、结尾'], answer: 'A', explanation: '议论文的三要素是论点、论据、论证。', createdAt: '2026-01-01' },
        { id: 'q-chinese-8-002', subject: 'chinese', grade: 8, knowledgePoint: '论据', difficulty: 3, type: 'choice', content: '论据分为哪两类？', options: ['A. 事实论据和道理论据', 'B. 时间论据和空间论据', 'C. 大论据和小论据', 'D. 开头论据和结尾论据'], answer: 'A', explanation: '论据分为事实论据（事例、数据）和道理论据（名言、原理）。', createdAt: '2026-01-01' },
        { id: 'q-chinese-8-003', subject: 'chinese', grade: 8, knowledgePoint: '古诗词', difficulty: 4, type: 'choice', content: '"人生自古谁无死，留取丹心照汗青"表达了什么情感？', options: ['A. 爱国情怀', 'B. 思乡', 'C. 友谊', 'D. 快乐'], answer: 'A', explanation: '这句话表达了诗人愿意为国献身的爱国情怀。', createdAt: '2026-01-01' },
        { id: 'q-chinese-8-004', subject: 'chinese', grade: 8, knowledgePoint: '文言文', difficulty: 4, type: 'choice', content: '"者"在文言文中常作什么？', options: ['A. 只作动词', 'B. 助词，表判断或停顿', 'C. 只作名词', 'D. 没有用法'], answer: 'B', explanation: '"者"常作助词，表示判断或语气停顿。', createdAt: '2026-01-01' },
        { id: 'q-chinese-8-005', subject: 'chinese', grade: 8, knowledgePoint: '写作', difficulty: 5, type: 'choice', content: '写议论文论证的方法有？', options: ['A. 举例论证、道理论证等', 'B. 只能举例', 'C. 只能引用', 'D. 不需要论证'], answer: 'A', explanation: '论证方法有举例论证、道理论证、对比论证、比喻论证等。', createdAt: '2026-01-01' },
        // 八年级英语
        { id: 'q-english-8-001', subject: 'english', grade: 8, knowledgePoint: '被动语态', difficulty: 3, type: 'choice', content: '被动语态的结构是？', options: ['A. 主语 + 动词', 'B. 主语 + be + 过去分词', 'C. 主语 + will + 动词', 'D. 主语 + do + 动词'], answer: 'B', explanation: '被动语态结构是主语 + be动词 + 过去分词。', createdAt: '2026-01-01' },
        { id: 'q-english-8-002', subject: 'english', grade: 8, knowledgePoint: '被动语态', difficulty: 3, type: 'choice', content: '"The book was written by him."是主动还是被动？', options: ['A. 主动', 'B. 被动', 'C. 两者都有', 'D. 不确定'], answer: 'B', explanation: 'was written是被动语态，表示书被写。', createdAt: '2026-01-01' },
        { id: 'q-english-8-003', subject: 'english', grade: 8, knowledgePoint: '被动语态转换', difficulty: 4, type: 'choice', content: '"He writes a book."的被动语态是？', options: ['A. A book writes by him.', 'B. A book is written by him.', 'C. A book was written by him.', 'D. He is written a book.'], answer: 'B', explanation: '主动变被动，宾语变主语：A book is written by him。', createdAt: '2026-01-01' },
        { id: 'q-english-8-004', subject: 'english', grade: 8, knowledgePoint: '词汇', difficulty: 4, type: 'choice', content: '"necessary"的意思是？', options: ['A. 必要的', 'B. 不必要的', 'C. 可能的', 'D. 不可能的'], answer: 'A', explanation: 'necessary的意思是必要的、必需的。', createdAt: '2026-01-01' },
        { id: 'q-english-8-005', subject: 'english', grade: 8, knowledgePoint: '句型', difficulty: 5, type: 'choice', content: '"It is important to learn English."中to learn English是什么成分？', options: ['A. 主语', 'B. 真正的主语', 'C. 谓语', 'D. 宾语'], answer: 'B', explanation: 'It是形式主语，to learn English是真正的主语。', createdAt: '2026-01-01' },
        // 八年级物理
        { id: 'q-physics-8-001', subject: 'physics', grade: 8, knowledgePoint: '力', difficulty: 2, type: 'choice', content: '力的三要素是？', options: ['A. 大小、方向、作用点', 'B. 速度、时间、距离', 'C. 质量、体积、密度', 'D. 长度、宽度、高度'], answer: 'A', explanation: '力的三要素是大小、方向、作用点。', createdAt: '2026-01-01' },
        { id: 'q-physics-8-002', subject: 'physics', grade: 8, knowledgePoint: '牛顿第一定律', difficulty: 3, type: 'choice', content: '牛顿第一定律又叫什么定律？', options: ['A. 加速度定律', 'B. 惯性定律', 'C. 作用力定律', 'D. 万有引力定律'], answer: 'B', explanation: '牛顿第一定律也叫惯性定律。', createdAt: '2026-01-01' },
        { id: 'q-physics-8-003', subject: 'physics', grade: 8, knowledgePoint: '惯性', difficulty: 3, type: 'choice', content: '惯性是什么？', options: ['A. 物体保持静止或匀速运动的性质', 'B. 物体运动很快', 'C. 物体很重', 'D. 物体很轻'], answer: 'A', explanation: '惯性是物体保持原来运动状态的性质。', createdAt: '2026-01-01' },
        { id: 'q-physics-8-004', subject: 'physics', grade: 8, knowledgePoint: '力的作用', difficulty: 4, type: 'choice', content: '力对物体的作用效果是？', options: ['A. 只能改变形状', 'B. 改变运动状态或形状', 'C. 只能改变速度', 'D. 没有效果'], answer: 'B', explanation: '力可以改变物体的运动状态或形状。', createdAt: '2026-01-01' },
        { id: 'q-physics-8-005', subject: 'physics', grade: 8, knowledgePoint: '平衡', difficulty: 4, type: 'choice', content: '二力平衡的条件不包括？', options: ['A. 大小相等', 'B. 方向相反', 'C. 作用在同一直线', 'D. 作用在不同物体'], answer: 'D', explanation: '二力平衡需要作用在同一物体上。', createdAt: '2026-01-01' },
        // 八年级化学
        { id: 'q-chemistry-8-001', subject: 'chemistry', grade: 8, knowledgePoint: '元素', difficulty: 2, type: 'choice', content: '元素是具有相同什么的一类原子？', options: ['A. 大小', 'B. 质量', 'C. 质子数（核电荷数）', 'D. 颜色'], answer: 'C', explanation: '元素是具有相同质子数（核电荷数）的一类原子的总称。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-8-002', subject: 'chemistry', grade: 8, knowledgePoint: '元素符号', difficulty: 3, type: 'choice', content: '氧元素的符号是？', options: ['A. O', 'B. N', 'C. C', 'D. H'], answer: 'A', explanation: '氧元素的符号是O。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-8-003', subject: 'chemistry', grade: 8, knowledgePoint: '化合物', difficulty: 3, type: 'choice', content: '水（H₂O）属于什么？', options: ['A. 混合物', 'B. 化合物', 'C. 单质', 'D. 元素'], answer: 'B', explanation: '水由两种元素组成，是化合物。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-8-004', subject: 'chemistry', grade: 8, knowledgePoint: '化学式', difficulty: 4, type: 'choice', content: '二氧化碳的化学式是？', options: ['A. CO', 'B. CO₂', 'C. O₂', 'D. C'], answer: 'B', explanation: '二氧化碳的化学式是CO₂。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-8-005', subject: 'chemistry', grade: 8, knowledgePoint: '质量', difficulty: 4, type: 'choice', content: '化学变化前后什么不变？', options: ['A. 物质种类', 'B. 原子种类和数目', 'C. 物质状态', 'D. 物质颜色'], answer: 'B', explanation: '化学变化前后原子种类和数目不变。', createdAt: '2026-01-01' },
        // 八年级生物
        { id: 'q-biology-8-001', subject: 'biology', grade: 8, knowledgePoint: '人体系统', difficulty: 2, type: 'choice', content: '人体消化食物主要在哪里？', options: ['A. 口腔', 'B. 小肠', 'C. 大肠', 'D. 胃'], answer: 'B', explanation: '小肠是消化和吸收的主要场所。', createdAt: '2026-01-01' },
        { id: 'q-biology-8-002', subject: 'biology', grade: 8, knowledgePoint: '消化系统', difficulty: 3, type: 'choice', content: '胃的主要功能是？', options: ['A. 只储存食物', 'B. 初步消化蛋白质', 'C. 吸收营养', 'D. 产生尿液'], answer: 'B', explanation: '胃的主要功能是储存食物并初步消化蛋白质。', createdAt: '2026-01-01' },
        { id: 'q-biology-8-003', subject: 'biology', grade: 8, knowledgePoint: '呼吸', difficulty: 3, type: 'choice', content: '呼吸的主要器官是？', options: ['A. 心脏', 'B. 肺', 'C. 肝', 'D. 脑'], answer: 'B', explanation: '肺是呼吸的主要器官。', createdAt: '2026-01-01' },
        { id: 'q-biology-8-004', subject: 'biology', grade: 8, knowledgePoint: '循环', difficulty: 4, type: 'choice', content: '血液循环的作用是？', options: ['A. 只运输氧气', 'B. 运输氧气、营养物质和废物', 'C. 只运输营养', 'D. 只运输废物'], answer: 'B', explanation: '血液循环运输氧气、营养物质和废物。', createdAt: '2026-01-01' },
        { id: 'q-biology-8-005', subject: 'biology', grade: 8, knowledgePoint: '心脏', difficulty: 4, type: 'choice', content: '心脏有几个腔？', options: ['A. 2个', 'B. 3个', 'C. 4个', 'D. 5个'], answer: 'C', explanation: '人有四个心腔：左心房、左心室、右心房、右心室。', createdAt: '2026-01-01' },

        // ===== 九年级题目 =====
        // 九年级数学
        { id: 'q-math-9-001', subject: 'math', grade: 9, knowledgePoint: '二次函数', difficulty: 3, type: 'choice', content: '二次函数的一般形式是？', options: ['A. y = kx + b', 'B. y = ax² + bx + c', 'C. y = k/x', 'D. y = x'], answer: 'B', explanation: '二次函数的一般形式是y = ax² + bx + c（a≠0）。', createdAt: '2026-01-01' },
        { id: 'q-math-9-002', subject: 'math', grade: 9, knowledgePoint: '抛物线', difficulty: 3, type: 'choice', content: '二次函数的图像是什么形状？', options: ['A. 直线', 'B. 抛物线', 'C. 圆', 'D. 三角形'], answer: 'B', explanation: '二次函数的图像是抛物线。', createdAt: '2026-01-01' },
        { id: 'q-math-9-003', subject: 'math', grade: 9, knowledgePoint: '一元二次方程', difficulty: 4, type: 'choice', content: '一元二次方程ax² + bx + c = 0的求根公式是？', options: ['A. x = -b/a', 'B. x = (-b ± √(b²-4ac))/2a', 'C. x = b/a', 'D. x = c/a'], answer: 'B', explanation: '一元二次方程的求根公式是x = (-b ± √(b²-4ac))/2a。', createdAt: '2026-01-01' },
        { id: 'q-math-9-004', subject: 'math', grade: 9, knowledgePoint: '方程求解', difficulty: 4, type: 'choice', content: '方程x² - 4 = 0的解是？', options: ['A. x = 2', 'B. x = 2或x = -2', 'C. x = 4', 'D. x = -4'], answer: 'B', explanation: 'x² = 4，x = ±2，解为x = 2或x = -2。', createdAt: '2026-01-01' },
        { id: 'q-math-9-005', subject: 'math', grade: 9, knowledgePoint: '概率', difficulty: 5, type: 'choice', content: '抛硬币，正面朝上的概率是？', options: ['A. 0', 'B. 1/2', 'C. 1', 'D. 1/4'], answer: 'B', explanation: '硬币有两面，正面概率是1/2。', createdAt: '2026-01-01' },
        // 九年级语文
        { id: 'q-chinese-9-001', subject: 'chinese', grade: 9, knowledgePoint: '古诗词鉴赏', difficulty: 3, type: 'choice', content: '鉴赏古诗词应该注意什么？', options: ['A. 只看字数', 'B. 理解意象、情感、手法', 'C. 只看标题', 'D. 不需要分析'], answer: 'B', explanation: '鉴赏古诗词要理解意象、情感表达和艺术手法。', createdAt: '2026-01-01' },
        { id: 'q-chinese-9-002', subject: 'chinese', grade: 9, knowledgePoint: '意象', difficulty: 4, type: 'choice', content: '"月亮"在古诗词中常象征什么？', options: ['A. 战争', 'B. 思乡、思念', 'C. 快乐', 'D. 生气'], answer: 'B', explanation: '"月亮"常象征思乡、思念亲人。', createdAt: '2026-01-01' },
        { id: 'q-chinese-9-003', subject: 'chinese', grade: 9, knowledgePoint: '表现手法', difficulty: 4, type: 'choice', content: '古诗词常见的表现手法不包括？', options: ['A. 借景抒情', 'B. 托物言志', 'C. 直白表达', 'D. 用典'], answer: 'C', explanation: '古诗词常用借景抒情、托物言志、用典等手法。', createdAt: '2026-01-01' },
        { id: 'q-chinese-9-004', subject: 'chinese', grade: 9, knowledgePoint: '文言文', difficulty: 5, type: 'choice', content: '"也"在文言文中常作什么？', options: ['A. 动词', 'B. 句末语气词，表判断或解释', 'C. 名词', 'D. 代词'], answer: 'B', explanation: '"也"常作句末语气词，表示判断或解释语气。', createdAt: '2026-01-01' },
        { id: 'q-chinese-9-005', subject: 'chinese', grade: 9, knowledgePoint: '写作', difficulty: 5, type: 'choice', content: '写高质量作文需要？', options: ['A. 只写开头', 'B. 明确中心、结构清晰、语言优美', 'C. 只写结尾', 'D. 不需要修改'], answer: 'B', explanation: '好作文需要明确中心、结构清晰、语言优美、认真修改。', createdAt: '2026-01-01' },
        // 九年级英语
        { id: 'q-english-9-001', subject: 'english', grade: 9, knowledgePoint: '宾语从句', difficulty: 3, type: 'choice', content: '宾语从句用什么连接？', options: ['A. 只用that', 'B. that、what、who等连接词', 'C. 只用and', 'D. 不需要连接'], answer: 'B', explanation: '宾语从句用that、what、who、where等连接词。', createdAt: '2026-01-01' },
        { id: 'q-english-9-002', subject: 'english', grade: 9, knowledgePoint: '宾语从句', difficulty: 4, type: 'choice', content: '"I know that he is a teacher."中that引导的是什么？', options: ['A. 主语', 'B. 宾语从句', 'C. 谓语', 'D. 形容词'], answer: 'B', explanation: 'that引导的是宾语从句，作know的宾语。', createdAt: '2026-01-01' },
        { id: 'q-english-9-003', subject: 'english', grade: 9, knowledgePoint: '宾语从句语序', difficulty: 4, type: 'choice', content: '宾语从句的语序应该是？', options: ['A. 疑问语序', 'B. 陈述语序', 'C. 随意', 'D. 不需要注意'], answer: 'B', explanation: '宾语从句用陈述语序，不用疑问语序。', createdAt: '2026-01-01' },
        { id: 'q-english-9-004', subject: 'english', grade: 9, knowledgePoint: '词汇', difficulty: 5, type: 'choice', content: '"achievement"的意思是？', options: ['A. 失败', 'B. 成就、成绩', 'C. 困难', 'D. 简单'], answer: 'B', explanation: 'achievement的意思是成就、成绩。', createdAt: '2026-01-01' },
        { id: 'q-english-9-005', subject: 'english', grade: 9, knowledgePoint: '写作', difficulty: 5, type: 'choice', content: '英语作文结尾常用的句型是？', options: ['A. First of all...', 'B. In conclusion...', 'C. However...', 'D. Therefore...'], answer: 'B', explanation: 'In conclusion...常用于结尾表示"总之"。', createdAt: '2026-01-01' },
        // 九年级物理
        { id: 'q-physics-9-001', subject: 'physics', grade: 9, knowledgePoint: '电学', difficulty: 3, type: 'choice', content: '电路的基本组成部分包括？', options: ['A. 电源、用电器、开关、导线', 'B. 只有电源', 'C. 只有开关', 'D. 只有导线'], answer: 'A', explanation: '电路基本组成：电源、用电器、开关、导线。', createdAt: '2026-01-01' },
        { id: 'q-physics-9-002', subject: 'physics', grade: 9, knowledgePoint: '欧姆定律', difficulty: 3, type: 'choice', content: '欧姆定律公式是？', options: ['A. I = U/R', 'B. U = I × R', 'C. R = U/I', 'D. 以上都是'], answer: 'D', explanation: '欧姆定律三种形式都正确：I = U/R、U = IR、R = U/I。', createdAt: '2026-01-01' },
        { id: 'q-physics-9-003', subject: 'physics', grade: 9, knowledgePoint: '电流', difficulty: 4, type: 'choice', content: '电流的单位是？', options: ['A. 伏特(V)', 'B. 安培(A)', 'C. 欧姆(Ω)', 'D. 瓦特(W)'], answer: 'B', explanation: '电流的单位是安培(A)。', createdAt: '2026-01-01' },
        { id: 'q-physics-9-004', subject: 'physics', grade: 9, knowledgePoint: '电压', difficulty: 4, type: 'choice', content: '电压的单位是？', options: ['A. 安培(A)', 'B. 伏特(V)', 'C. 欧姆(Ω)', 'D. 瓦特(W)'], answer: 'B', explanation: '电压的单位是伏特(V)。', createdAt: '2026-01-01' },
        { id: 'q-physics-9-005', subject: 'physics', grade: 9, knowledgePoint: '电功率', difficulty: 5, type: 'choice', content: '电功率的计算公式是？', options: ['A. P = U × I', 'B. P = U/I', 'C. P = I/U', 'D. P = U + I'], answer: 'A', explanation: '电功率公式P = UI（或P = I²R、P = U²/R）。', createdAt: '2026-01-01' },
        // 九年级化学
        { id: 'q-chemistry-9-001', subject: 'chemistry', grade: 9, knowledgePoint: '元素周期表', difficulty: 3, type: 'choice', content: '元素周期表是按什么排列的？', options: ['A. 原子大小', 'B. 原子序数（质子数）', 'C. 原子质量', 'D. 随机排列'], answer: 'B', explanation: '元素周期表按原子序数（质子数）排列。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-9-002', subject: 'chemistry', grade: 9, knowledgePoint: '周期', difficulty: 3, type: 'choice', content: '元素周期表有几个周期？', options: ['A. 5个', 'B. 6个', 'C. 7个', 'D. 8个'], answer: 'C', explanation: '元素周期表有7个周期。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-9-003', subject: 'chemistry', grade: 9, knowledgePoint: '元素性质', difficulty: 4, type: 'choice', content: '同一周期元素从左到右，原子半径怎么变化？', options: ['A. 增大', 'B. 减小', 'C. 不变', 'D. 随机'], answer: 'B', explanation: '同一周期从左到右，原子半径逐渐减小。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-9-004', subject: 'chemistry', grade: 9, knowledgePoint: '化学方程式', difficulty: 4, type: 'choice', content: '化学方程式必须遵守什么定律？', options: ['A. 只有能量守恒', 'B. 质量守恒定律', 'C. 只有体积守恒', 'D. 不需要守恒'], answer: 'B', explanation: '化学方程式必须遵守质量守恒定律。', createdAt: '2026-01-01' },
        { id: 'q-chemistry-9-005', subject: 'chemistry', grade: 9, knowledgePoint: '化学反应', difficulty: 5, type: 'choice', content: '实验室制取二氧化碳用什么？', options: ['A. 木炭燃烧', 'B. 石灰石和稀盐酸', 'C. 电解水', 'D. 加热碳酸钙'], answer: 'B', explanation: '实验室常用石灰石（碳酸钙）和稀盐酸制取CO₂。', createdAt: '2026-01-01' },
        // 九年级生物
        { id: 'q-biology-9-001', subject: 'biology', grade: 9, knowledgePoint: '遗传', difficulty: 3, type: 'choice', content: '遗传物质主要是什么？', options: ['A. 蛋白质', 'B. DNA', 'C. 水', 'D. 糖'], answer: 'B', explanation: 'DNA是主要的遗传物质。', createdAt: '2026-01-01' },
        { id: 'q-biology-9-002', subject: 'biology', grade: 9, knowledgePoint: 'DNA', difficulty: 3, type: 'choice', content: 'DNA的全称是？', options: ['A. 核糖核酸', 'B. 脱氧核糖核酸', 'C. 蛋白质', 'D. 氨基酸'], answer: 'B', explanation: 'DNA全称是脱氧核糖核酸。', createdAt: '2026-01-01' },
        { id: 'q-biology-9-003', subject: 'biology', grade: 9, knowledgePoint: '基因', difficulty: 4, type: 'choice', content: '基因是什么？', options: ['A. 整个DNA', 'B. 有遗传效应的DNA片段', 'C. 蛋白质', 'D. 细胞'], answer: 'B', explanation: '基因是有遗传效应的DNA片段。', createdAt: '2026-01-01' },
        { id: 'q-biology-9-004', subject: 'biology', grade: 9, knowledgePoint: '染色体', difficulty: 4, type: 'choice', content: '染色体由什么组成？', options: ['A. 只有DNA', 'B. DNA和蛋白质', 'C. 只有蛋白质', 'D. 只有水'], answer: 'B', explanation: '染色体由DNA和蛋白质组成。', createdAt: '2026-01-01' },
        { id: 'q-biology-9-005', subject: 'biology', grade: 9, knowledgePoint: '进化', difficulty: 5, type: 'choice', content: '自然选择学说的主要内容不包括？', options: ['A. 过度繁殖', 'B. 生存斗争', 'C. 随机变异', 'D. 遗传和变异'], answer: 'C', explanation: '自然选择包括过度繁殖、生存斗争、遗传变异、适者生存。变异不是随机的选择结果。', createdAt: '2026-01-01' }
    ],

    /**
     * 模拟课程数据
     */
    mockCourses: [
        {
            id: 'course-math-001',
            subject: 'math',
            grade: 1,
            title: '一年级数学：认识数字',
            description: '认识0-100的数字，学习数字的读写和大小比较。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，数字，卡通风格，蓝色主题&image_size=landscape_4_3',
            studentsCount: 2100,
            difficulty: 1,
            videos: [
                {
                    id: 'video-math-001-01',
                    title: '认识数字1-10',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 240,
                    knowledgePoints: ['数字认知', '数数']
                },
                {
                    id: 'video-math-001-02',
                    title: '数字大小比较',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 220,
                    knowledgePoints: ['大小比较', '数字顺序']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-001',
            subject: 'chinese',
            grade: 1,
            title: '一年级语文：拼音入门',
            description: '学习汉语拼音，掌握声母、韵母和声调。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，拼音字母，卡通风格，橙色主题&image_size=landscape_4_3',
            studentsCount: 1850,
            difficulty: 1,
            videos: [
                {
                    id: 'video-chinese-001-01',
                    title: '认识声母',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 300,
                    knowledgePoints: ['声母', '发音']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-001',
            subject: 'english',
            grade: 1,
            title: '一年级英语：ABC字母',
            description: '学习26个英文字母，掌握字母发音和书写。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，字母ABC，卡通风格，绿色主题&image_size=landscape_4_3',
            studentsCount: 2300,
            difficulty: 1,
            videos: [
                {
                    id: 'video-english-001-01',
                    title: '字母A-Z',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 280,
                    knowledgePoints: ['字母认知', '字母发音']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-science-001',
            subject: 'science',
            grade: 1,
            title: '一年级科学：认识自然',
            description: '探索大自然的奥秘，认识动植物和自然现象。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=科学课本封面，大自然，动植物，卡通风格，绿色主题&image_size=landscape_4_3',
            studentsCount: 1650,
            difficulty: 1,
            videos: [
                {
                    id: 'video-science-001-01',
                    title: '认识小动物',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 260,
                    knowledgePoints: ['动物认知', '自然观察']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-002',
            subject: 'math',
            grade: 2,
            title: '二年级数学：加减法',
            description: '学习100以内的加减法，掌握进位和退位。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，加减法，卡通风格，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1980,
            difficulty: 2,
            videos: [
                {
                    id: 'video-math-002-01',
                    title: '20以内加减法',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 280,
                    knowledgePoints: ['加法', '减法']
                },
                {
                    id: 'video-math-002-02',
                    title: '100以内加减法',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 320,
                    knowledgePoints: ['进位加法', '退位减法']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-002',
            subject: 'chinese',
            grade: 2,
            title: '二年级语文：识字',
            description: '学习常用汉字，掌握汉字的笔画和结构。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，汉字，书法，橙色主题&image_size=landscape_4_3',
            studentsCount: 1720,
            difficulty: 2,
            videos: [
                {
                    id: 'video-chinese-002-01',
                    title: '汉字笔画顺序',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 300,
                    knowledgePoints: ['笔画', '汉字结构']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-002',
            subject: 'english',
            grade: 2,
            title: '二年级英语：日常问候',
            description: '学习日常英语问候语，掌握简单对话。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，日常对话，卡通风格，绿色主题&image_size=landscape_4_3',
            studentsCount: 2100,
            difficulty: 1,
            videos: [
                {
                    id: 'video-english-002-01',
                    title: '日常问候语',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 240,
                    knowledgePoints: ['问候语', '简单对话']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-science-002',
            subject: 'science',
            grade: 2,
            title: '二年级科学：身边的科学',
            description: '探索身边的科学现象，培养科学好奇心。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=科学课本封面，日常生活科学，卡通风格，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1580,
            difficulty: 1,
            videos: [
                {
                    id: 'video-science-002-01',
                    title: '有趣的影子',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 250,
                    knowledgePoints: ['影子', '光']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-003',
            subject: 'math',
            grade: 3,
            title: '三年级数学：乘法与除法',
            description: '学习乘法口诀和除法运算，掌握基本乘除法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，乘法口诀，简洁设计，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1850,
            difficulty: 2,
            videos: [
                {
                    id: 'video-math-003-01',
                    title: '乘法口诀表',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 300,
                    knowledgePoints: ['乘法', '乘法口诀']
                },
                {
                    id: 'video-math-003-02',
                    title: '除法入门',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 280,
                    knowledgePoints: ['除法', '平均分']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-003',
            subject: 'chinese',
            grade: 3,
            title: '三年级语文：阅读理解',
            description: '培养阅读理解能力，学会分析文章结构和主题。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，阅读，文化气息，橙色主题&image_size=landscape_4_3',
            studentsCount: 1680,
            difficulty: 2,
            videos: [
                {
                    id: 'video-chinese-003-01',
                    title: '如何理解文章主题',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 350,
                    knowledgePoints: ['阅读技巧', '主题分析']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-003',
            subject: 'english',
            grade: 3,
            title: '三年级英语：基础词汇',
            description: '学习常用英语单词，掌握基础词汇和简单句型。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，单词，国际化风格，绿色主题&image_size=landscape_4_3',
            studentsCount: 1920,
            difficulty: 1,
            videos: [
                {
                    id: 'video-english-003-01',
                    title: '认识水果单词',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 260,
                    knowledgePoints: ['水果词汇', '单词记忆']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-science-003',
            subject: 'science',
            grade: 3,
            title: '三年级科学：植物世界',
            description: '探索植物的生长过程，了解植物的结构和功能。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=科学课本封面，植物，花草，绿色主题&image_size=landscape_4_3',
            studentsCount: 1450,
            difficulty: 2,
            videos: [
                {
                    id: 'video-science-003-01',
                    title: '植物的生长',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 300,
                    knowledgePoints: ['植物生长', '光合作用']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-004',
            subject: 'math',
            grade: 4,
            title: '四年级数学：四则运算',
            description: '学习四则混合运算，掌握运算顺序和简便计算。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，四则运算，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1750,
            difficulty: 3,
            videos: [
                {
                    id: 'video-math-004-01',
                    title: '四则混合运算',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 350,
                    knowledgePoints: ['四则运算', '运算顺序']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-004',
            subject: 'chinese',
            grade: 4,
            title: '四年级语文：作文入门',
            description: '学习写作文，掌握记叙文的写作方法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，作文，写作，橙色主题&image_size=landscape_4_3',
            studentsCount: 1520,
            difficulty: 3,
            videos: [
                {
                    id: 'video-chinese-004-01',
                    title: '记叙文写作技巧',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 380,
                    knowledgePoints: ['记叙文', '写作方法']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-004',
            subject: 'english',
            grade: 4,
            title: '四年级英语：简单句型',
            description: '学习英语基本句型，掌握简单句子的构成。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，句型，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1800,
            difficulty: 2,
            videos: [
                {
                    id: 'video-english-004-01',
                    title: '主谓宾句型',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 300,
                    knowledgePoints: ['句型', '语法']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-science-004',
            subject: 'science',
            grade: 4,
            title: '四年级科学：有趣的实验',
            description: '通过有趣的科学实验，培养孩子的科学思维和动手能力。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=科学实验课程封面，实验室，试管，科学，彩色&image_size=landscape_4_3',
            studentsCount: 1678,
            difficulty: 2,
            videos: [
                {
                    id: 'video-science-004-01',
                    title: '神奇的化学反应',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 320,
                    knowledgePoints: ['化学实验', '科学方法']
                },
                {
                    id: 'video-science-004-02',
                    title: '物理小实验',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 360,
                    knowledgePoints: ['物理实验', '动手实践']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-005',
            subject: 'math',
            grade: 5,
            title: '五年级数学：小数与分数',
            description: '学习小数和分数的运算，掌握它们之间的转换。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，小数分数，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1680,
            difficulty: 3,
            videos: [
                {
                    id: 'video-math-005-01',
                    title: '小数的认识',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 320,
                    knowledgePoints: ['小数', '小数点']
                },
                {
                    id: 'video-math-005-02',
                    title: '分数运算',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 360,
                    knowledgePoints: ['分数', '约分']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-005',
            subject: 'chinese',
            grade: 5,
            title: '五年级语文：古诗词',
            description: '学习经典古诗词，理解诗意和文化内涵。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，古诗词，水墨画，橙色主题&image_size=landscape_4_3',
            studentsCount: 1450,
            difficulty: 3,
            videos: [
                {
                    id: 'video-chinese-005-01',
                    title: '古诗赏析',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 380,
                    knowledgePoints: ['古诗词', '诗意理解']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-005',
            subject: 'english',
            grade: 5,
            title: '五年级英语：时态入门',
            description: '学习英语一般现在时和现在进行时，掌握时态变化。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，时态，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1720,
            difficulty: 3,
            videos: [
                {
                    id: 'video-english-005-01',
                    title: '一般现在时',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 340,
                    knowledgePoints: ['时态', '动词变化']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-ai-001',
            subject: 'science',
            grade: 5,
            title: 'AI人工智能启蒙课',
            description: '了解人工智能基础知识，探索AI在生活中的应用，培养科技思维。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=人工智能AI课程封面，科技感，未来感，蓝色紫色渐变&image_size=landscape_4_3',
            studentsCount: 2345,
            difficulty: 3,
            videos: [
                {
                    id: 'video-ai-001-01',
                    title: '什么是人工智能？',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 420,
                    knowledgePoints: ['AI概念', '人工智能历史']
                },
                {
                    id: 'video-ai-001-02',
                    title: 'AI在生活中的应用',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 380,
                    knowledgePoints: ['AI应用', '智能家居']
                },
                {
                    id: 'video-ai-001-03',
                    title: '机器学习入门',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 450,
                    knowledgePoints: ['机器学习', '算法基础']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-006',
            subject: 'math',
            grade: 6,
            title: '六年级数学：比例与百分数',
            description: '学习比例、百分数和折扣问题，掌握实际应用。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，比例百分数，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1580,
            difficulty: 3,
            videos: [
                {
                    id: 'video-math-006-01',
                    title: '比例的意义',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 340,
                    knowledgePoints: ['比例', '比例的基本性质']
                },
                {
                    id: 'video-math-006-02',
                    title: '百分数应用',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 360,
                    knowledgePoints: ['百分数', '折扣']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-006',
            subject: 'chinese',
            grade: 6,
            title: '六年级语文：文言文',
            description: '学习文言文基础知识，理解古文的含义和语法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，文言文，古代书籍，橙色主题&image_size=landscape_4_3',
            studentsCount: 1380,
            difficulty: 4,
            videos: [
                {
                    id: 'video-chinese-006-01',
                    title: '文言文入门',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 400,
                    knowledgePoints: ['文言文', '古文翻译']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-006',
            subject: 'english',
            grade: 6,
            title: '六年级英语：一般过去时',
            description: '学习英语一般过去时，掌握动词过去式的变化规则。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，过去时，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1650,
            difficulty: 3,
            videos: [
                {
                    id: 'video-english-006-01',
                    title: '一般过去时',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 360,
                    knowledgePoints: ['过去时', '动词变化']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-science-006',
            subject: 'science',
            grade: 6,
            title: '六年级科学：地球与宇宙',
            description: '探索地球和宇宙的奥秘，了解太阳系和行星。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=科学课本封面，地球宇宙，星空，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1520,
            difficulty: 3,
            videos: [
                {
                    id: 'video-science-006-01',
                    title: '太阳系探秘',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 380,
                    knowledgePoints: ['太阳系', '行星']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-007',
            subject: 'math',
            grade: 7,
            title: '七年级数学：一元一次方程',
            description: '学习一元一次方程的解法，掌握方程应用题。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，方程，代数，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1420,
            difficulty: 3,
            videos: [
                {
                    id: 'video-math-007-01',
                    title: '一元一次方程解法',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 380,
                    knowledgePoints: ['方程', '解方程']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-007',
            subject: 'chinese',
            grade: 7,
            title: '七年级语文：现代文阅读',
            description: '学习现代文阅读技巧，提高阅读理解能力。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，现代文，阅读，橙色主题&image_size=landscape_4_3',
            studentsCount: 1280,
            difficulty: 3,
            videos: [
                {
                    id: 'video-chinese-007-01',
                    title: '现代文阅读技巧',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 400,
                    knowledgePoints: ['现代文', '阅读技巧']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-007',
            subject: 'english',
            grade: 7,
            title: '七年级英语：一般将来时',
            description: '学习英语一般将来时，掌握将来时态的表达方法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，将来时，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1520,
            difficulty: 3,
            videos: [
                {
                    id: 'video-english-007-01',
                    title: '一般将来时',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 340,
                    knowledgePoints: ['将来时', 'will/be going to']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-physics-001',
            subject: 'physics',
            grade: 7,
            title: '七年级物理：声现象',
            description: '学习声音的产生和传播，了解声学基础知识。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=物理课程封面，声音，声波，紫色主题&image_size=landscape_4_3',
            studentsCount: 1180,
            difficulty: 3,
            videos: [
                {
                    id: 'video-physics-001-01',
                    title: '声音的产生',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 320,
                    knowledgePoints: ['声音', '声波']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chemistry-001',
            subject: 'chemistry',
            grade: 7,
            title: '七年级化学：物质的变化',
            description: '学习物理变化和化学变化，了解物质的基本性质。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=化学课程封面，物质变化，分子，红色主题&image_size=landscape_4_3',
            studentsCount: 1050,
            difficulty: 3,
            videos: [
                {
                    id: 'video-chemistry-001-01',
                    title: '物理变化与化学变化',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 340,
                    knowledgePoints: ['物理变化', '化学变化']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-biology-001',
            subject: 'biology',
            grade: 7,
            title: '七年级生物：细胞结构',
            description: '学习细胞的基本结构，了解细胞是生命的基本单位。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=生物课程封面，细胞，显微镜，绿色主题&image_size=landscape_4_3',
            studentsCount: 1120,
            difficulty: 3,
            videos: [
                {
                    id: 'video-biology-001-01',
                    title: '细胞的结构',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 360,
                    knowledgePoints: ['细胞', '细胞膜']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-008',
            subject: 'math',
            grade: 8,
            title: '八年级数学：一次函数',
            description: '学习一次函数的概念和图像，掌握函数的应用。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，函数图像，坐标，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1350,
            difficulty: 4,
            videos: [
                {
                    id: 'video-math-008-01',
                    title: '一次函数的概念',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 400,
                    knowledgePoints: ['一次函数', '函数图像']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-008',
            subject: 'chinese',
            grade: 8,
            title: '八年级语文：议论文',
            description: '学习议论文的写作方法，掌握论点、论据和论证。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，议论文，辩论，橙色主题&image_size=landscape_4_3',
            studentsCount: 1180,
            difficulty: 4,
            videos: [
                {
                    id: 'video-chinese-008-01',
                    title: '议论文写作技巧',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 420,
                    knowledgePoints: ['议论文', '论证方法']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-008',
            subject: 'english',
            grade: 8,
            title: '八年级英语：被动语态',
            description: '学习英语被动语态，掌握被动语态的用法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，被动语态，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1420,
            difficulty: 4,
            videos: [
                {
                    id: 'video-english-008-01',
                    title: '被动语态',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 380,
                    knowledgePoints: ['被动语态', 'be+过去分词']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-physics-002',
            subject: 'physics',
            grade: 8,
            title: '八年级物理：力学基础',
            description: '学习牛顿力学定律，理解力、质量、加速度等基本概念。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=物理课程封面，力学，牛顿，科学，紫色主题&image_size=landscape_4_3',
            studentsCount: 945,
            difficulty: 4,
            videos: [
                {
                    id: 'video-physics-002-01',
                    title: '牛顿第一定律',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 400,
                    knowledgePoints: ['惯性', '牛顿定律']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chemistry-002',
            subject: 'chemistry',
            grade: 8,
            title: '八年级化学：元素与化合物',
            description: '学习元素和化合物的概念，了解常见物质的组成。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=化学课程封面，元素，化合物，红色主题&image_size=landscape_4_3',
            studentsCount: 980,
            difficulty: 4,
            videos: [
                {
                    id: 'video-chemistry-002-01',
                    title: '元素与化合物',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 360,
                    knowledgePoints: ['元素', '化合物']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-biology-002',
            subject: 'biology',
            grade: 8,
            title: '八年级生物：人体系统',
            description: '学习人体各大系统的结构和功能，了解生命活动。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=生物课程封面，人体系统，器官，绿色主题&image_size=landscape_4_3',
            studentsCount: 1050,
            difficulty: 4,
            videos: [
                {
                    id: 'video-biology-002-01',
                    title: '消化系统',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 380,
                    knowledgePoints: ['消化系统', '器官']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-math-009',
            subject: 'math',
            grade: 9,
            title: '九年级数学：二次函数',
            description: '学习二次函数的图像和性质，掌握二次方程的解法。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=数学课本封面，二次函数，抛物线，蓝色主题&image_size=landscape_4_3',
            studentsCount: 1280,
            difficulty: 5,
            videos: [
                {
                    id: 'video-math-009-01',
                    title: '二次函数的图像',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 420,
                    knowledgePoints: ['二次函数', '抛物线']
                },
                {
                    id: 'video-math-009-02',
                    title: '一元二次方程',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 450,
                    knowledgePoints: ['二次方程', '求根公式']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chinese-009',
            subject: 'chinese',
            grade: 9,
            title: '九年级语文：古诗词鉴赏',
            description: '深入学习古诗词，掌握诗词鉴赏的方法和技巧。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=语文课本封面，古诗词鉴赏，古典风格，橙色主题&image_size=landscape_4_3',
            studentsCount: 1120,
            difficulty: 5,
            videos: [
                {
                    id: 'video-chinese-009-01',
                    title: '诗词鉴赏技巧',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 450,
                    knowledgePoints: ['诗词鉴赏', '表现手法']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-english-009',
            subject: 'english',
            grade: 9,
            title: '九年级英语：宾语从句',
            description: '学习英语宾语从句，掌握复合句的结构。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=英语课本封面，宾语从句，语法，绿色主题&image_size=landscape_4_3',
            studentsCount: 1350,
            difficulty: 5,
            videos: [
                {
                    id: 'video-english-009-01',
                    title: '宾语从句',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 400,
                    knowledgePoints: ['宾语从句', '复合句']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-physics-003',
            subject: 'physics',
            grade: 9,
            title: '九年级物理：电学基础',
            description: '学习电路和电磁学基础知识，掌握欧姆定律。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=物理课程封面，电学，电路图，闪电，紫色主题&image_size=landscape_4_3',
            studentsCount: 1100,
            difficulty: 5,
            videos: [
                {
                    id: 'video-physics-003-01',
                    title: '电路与欧姆定律',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 450,
                    knowledgePoints: ['电路', '欧姆定律']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-chemistry-003',
            subject: 'chemistry',
            grade: 9,
            title: '九年级化学：元素周期表',
            description: '学习元素周期表的规律，了解常见元素的性质。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=化学课程封面，元素周期表，烧杯，分子结构，红色主题&image_size=landscape_4_3',
            studentsCount: 756,
            difficulty: 4,
            videos: [
                {
                    id: 'video-chemistry-003-01',
                    title: '元素周期表的奥秘',
                    url: 'https://www.w3schools.com/html/movie.mp4',
                    duration: 420,
                    knowledgePoints: ['元素周期表', '化学元素']
                }
            ],
            createdAt: '2026-01-01'
        },
        {
            id: 'course-biology-003',
            subject: 'biology',
            grade: 9,
            title: '九年级生物：遗传与进化',
            description: '学习遗传和进化的基础知识，了解DNA和基因。',
            coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=生物课程封面，DNA，遗传，进化，绿色主题&image_size=landscape_4_3',
            studentsCount: 980,
            difficulty: 5,
            videos: [
                {
                    id: 'video-biology-003-01',
                    title: 'DNA与基因',
                    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                    duration: 420,
                    knowledgePoints: ['DNA', '基因']
                }
            ],
            createdAt: '2026-01-01'
        }
    ],

    /**
     * 获取题目列表
     * @param {object} filters - 筛选条件
     * @returns {array} 题目列表
     */
    getQuestions(filters = {}) {
        // 从本地存储获取题目，如果没有则使用模拟数据
        let questions = Storage.get('questions') || this.mockQuestions;

        // 应用筛选条件
        if (filters.subject) {
            questions = questions.filter(q => q.subject === filters.subject);
        }
        if (filters.grade) {
            questions = questions.filter(q => q.grade === filters.grade);
        }
        if (filters.difficulty) {
            questions = questions.filter(q => q.difficulty === filters.difficulty);
        }
        if (filters.knowledgePoint) {
            questions = questions.filter(q => q.knowledgePoint === filters.knowledgePoint);
        }

        return questions;
    },

    /**
     * 获取单个题目
     * @param {string} questionId - 题目ID
     * @returns {object|null} 题目信息
     */
    getQuestion(questionId) {
        const questions = Storage.get('questions') || this.mockQuestions;
        return questions.find(q => q.id === questionId) || null;
    },

    /**
     * 提交答案
     * @param {string} questionId - 题目ID
     * @param {string} answer - 用户答案
     * @returns {object} 答题结果
     */
    submitAnswer(questionId, answer) {
        const question = this.getQuestion(questionId);

        if (!question) {
            return {
                success: false,
                message: '题目不存在'
            };
        }

        const correct = question.answer === answer;
        const score = correct ? 100 : 0;

        // 记录学习记录
        const record = {
            itemType: 'question',
            itemId: questionId,
            subject: question.subject,
            endTime: new Date().toISOString(),
            score
        };
        Storage.addLearningRecord(record);

        // 如果答错，添加到错题本
        if (!correct) {
            Storage.addMistake({
                questionId,
                question: question.content,
                correctAnswer: question.answer,
                wrongAnswer: answer,
                explanation: question.explanation
            });
        }

        return {
            success: true,
            correct,
            correctAnswer: question.answer,
            explanation: question.explanation,
            score
        };
    },

    /**
     * 获取课程列表
     * @param {object} filters - 筛选条件
     * @returns {array} 课程列表
     */
    getCourses(filters = {}) {
        // 从本地存储获取课程，如果没有则使用模拟数据
        let courses = Storage.get('courses') || this.mockCourses;

        // 应用筛选条件
        if (filters.subject) {
            courses = courses.filter(c => c.subject === filters.subject);
        }
        if (filters.grade) {
            courses = courses.filter(c => c.grade === filters.grade);
        }

        return courses;
    },

    /**
     * 获取单个课程
     * @param {string} courseId - 课程ID
     * @returns {object|null} 课程信息
     */
    getCourse(courseId) {
        const courses = Storage.get('courses') || this.mockCourses;
        return courses.find(c => c.id === courseId) || null;
    },

    /**
     * 获取课程视频列表
     * @param {string} courseId - 课程ID
     * @returns {array} 视频列表
     */
    getCourseVideos(courseId) {
        const course = this.getCourse(courseId);
        return course ? course.videos || [] : [];
    },

    /**
     * 记录视频观看
     * @param {string} videoId - 视频ID
     * @param {string} courseId - 课程ID
     * @returns {object} 结果
     */
    recordVideoWatch(videoId, courseId) {
        const course = this.getCourse(courseId);

        if (!course) {
            return {
                success: false,
                message: '课程不存在'
            };
        }

        // 记录学习记录
        const record = {
            itemType: 'video',
            itemId: videoId,
            subject: course.subject,
            endTime: new Date().toISOString(),
            completed: true
        };
        Storage.addLearningRecord(record);

        return {
            success: true,
            message: '观看记录已保存'
        };
    },

    /**
     * AI智能问答（模拟）
     * @param {string} question - 用户问题
     * @returns {object} AI回答
     */
    aiChat(question) {
        // 模拟AI回答
        const responses = {
            math: [
                '这道数学题的关键是理解题目要求...',
                '我们可以用方程来解决这个问题...',
                '首先，让我们分析题目中的数量关系...'
            ],
            chinese: [
                '这道语文题主要考察的是...',
                '从文章的上下文来看...',
                '这个成语的典故来源是...'
            ],
            english: [
                '这个英语单词的用法是...',
                '英语句子的基本结构是...',
                '需要注意英语语法中的...'
            ],
            default: [
                '让我来帮你分析这个问题...',
                '这是一个很好的问题，让我们一步步解决...',
                '根据你的描述，我的建议是...'
            ]
        };

        // 检测问题类型
        let type = 'default';
        if (question.includes('数学') || question.includes('计算') || question.includes('+')) {
            type = 'math';
        } else if (question.includes('语文') || question.includes('阅读') || question.includes('成语')) {
            type = 'chinese';
        } else if (question.includes('英语') || question.includes('单词') || question.includes('English')) {
            type = 'english';
        }

        // 随机选择一个回答
        const responseList = responses[type];
        const randomIndex = Math.floor(Math.random() * responseList.length);
        const answer = responseList[randomIndex];

        return {
            success: true,
            answer,
            relatedQuestions: [
                '相关知识点1：...',
                '相关知识点2：...'
            ],
            timestamp: new Date().toISOString()
        };
    },

    /**
     * AI拍照搜题（模拟）
     * @param {string} imageUrl - 图片URL（实际应用中需要上传图片）
     * @returns {object} AI识别结果
     */
    aiPhotoSearch(imageUrl) {
        // 模拟AI识别结果
        return {
            success: true,
            question: '识别到的题目：小明有5个苹果...',
            answer: '8个',
            explanation: '这是一道简单的加法题...',
            relatedKnowledge: ['加法运算', '应用题'],
            confidence: 0.95,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 获取学习报告
     * @param {object} params - 参数
     * @returns {object} 学习报告
     */
    getLearningReport(params = {}) {
        const todayStats = Storage.getTodayStats();
        const weeklyStats = Storage.getWeeklyStats();
        const subjectStats = Storage.getSubjectStats();
        const mistakes = Storage.getMistakes();

        return {
            success: true,
            data: {
                todayStats,
                weeklyStats,
                subjectStats,
                mistakesCount: mistakes.length,
                recommendations: [
                    '建议加强练习：数学计算',
                    '本周学习表现良好，继续保持',
                    '错题本有3道题目待复习'
                ]
            }
        };
    },

    /**
     * 初始化数据（首次使用时）
     */
    initData() {
        const DATA_VERSION = '1.8';
        const savedVersion = Storage.get('data_api_version');

        if (savedVersion !== DATA_VERSION) {
            Storage.set('questions', this.mockQuestions);
            Storage.set('courses', this.mockCourses);
            Storage.set('data_api_version', DATA_VERSION);
        }
    }
};

// 导出API对象（兼容模块化和全局使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
} else {
    window.API = API;
}