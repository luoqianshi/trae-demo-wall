/**
 * Mock 数据模块
 * 预设 3 套作业批改数据，模拟 AI 批改结果
 * 后续替换真实 AI API 时，只需修改 getGradingResult() 函数
 */

var MockData = {

  /**
   * 根据类型获取 mock 批改数据
   * @param {string} type - 'math' | 'chinese' | 'english' | 'random'
   * @returns {object} 批改结果
   */
  getGradingResult: function(type) {
    var types = ['math', 'chinese', 'english'];
    if (type === 'random' || !type) {
      type = types[Math.floor(Math.random() * types.length)];
    }
    return this.data[type];
  },

  /**
   * 三套 mock 数据
   */
  data: {

    // 小学数学 - 计算题
    math: {
      subject: '小学数学',
      type: '计算题',
      questions: [
        {
          id: 1,
          content: '25 + 37 = ?',
          studentAnswer: '62',
          correctAnswer: '62',
          isCorrect: true,
          explanation: '个位 5+7=12，写 2 进 1；十位 2+3+1=6，所以 25+37=62。'
        },
        {
          id: 2,
          content: '84 - 29 = ?',
          studentAnswer: '55',
          correctAnswer: '55',
          isCorrect: true,
          explanation: '个位 4-9 不够减，向十位借 1，14-9=5；十位 8-1-2=5，所以 84-29=55。'
        },
        {
          id: 3,
          content: '12 x 6 = ?',
          studentAnswer: '62',
          correctAnswer: '72',
          isCorrect: false,
          explanation: '12 x 6 = 10 x 6 + 2 x 6 = 60 + 12 = 72。注意个位 2 x 6 = 12，进位后十位是 6+1=7。'
        },
        {
          id: 4,
          content: '96 / 8 = ?',
          studentAnswer: '12',
          correctAnswer: '12',
          isCorrect: true,
          explanation: '96 / 8：8 x 10 = 80，96 - 80 = 16，8 x 2 = 16，所以 10 + 2 = 12。'
        },
        {
          id: 5,
          content: '45 + 38 - 20 = ?',
          studentAnswer: '53',
          correctAnswer: '63',
          isCorrect: false,
          explanation: '先算 45 + 38 = 83，再算 83 - 20 = 63。从左到右依次计算。'
        }
      ]
    },

    // 小学语文 - 看拼音写词语
    chinese: {
      subject: '小学语文',
      type: '看拼音写词语',
      questions: [
        {
          id: 1,
          content: 'zhuo yue（写出汉字）',
          studentAnswer: '卓越',
          correctAnswer: '卓越',
          isCorrect: true,
          explanation: '"zhuo yue" 写为"卓越"，意为超出一般、非常优秀。'
        },
        {
          id: 2,
          content: 'piao liang（写出汉字）',
          studentAnswer: '漂亮',
          correctAnswer: '漂亮',
          isCorrect: true,
          explanation: '"piao liang" 写为"漂亮"，形容好看、美观。'
        },
        {
          id: 3,
          content: 'xiong meng（写出汉字）',
          studentAnswer: '凶孟',
          correctAnswer: '凶猛',
          isCorrect: false,
          explanation: '"xiong meng" 应写为"凶猛"，"猛"字左边是反犬旁（犭），不是"孟"。'
        },
        {
          id: 4,
          content: 'can lan（写出汉字）',
          studentAnswer: '灿烂',
          correctAnswer: '灿烂',
          isCorrect: true,
          explanation: '"can lan" 写为"灿烂"，形容光彩鲜明。'
        },
        {
          id: 5,
          content: 'jing rong（写出汉字）',
          studentAnswer: '敬容',
          correctAnswer: '惊容',
          isCorrect: false,
          explanation: '"jing rong" 应写为"惊容"，意为惊讶的表情。注意"惊"的右边是"京"，不是"敬"。'
        }
      ]
    },

    // 初中英语 - 选择题
    english: {
      subject: '初中英语',
      type: '选择题',
      questions: [
        {
          id: 1,
          content: 'She ___ to school every day.\nA. go  B. goes  C. going  D. went',
          studentAnswer: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          explanation: '主语 She 是第三人称单数，every day 表示一般现在时，动词用第三人称单数形式 goes。'
        },
        {
          id: 2,
          content: 'There ___ a book and two pens on the desk.\nA. is  B. are  C. have  D. has',
          studentAnswer: 'B',
          correctAnswer: 'A',
          isCorrect: false,
          explanation: 'There be 句型遵循就近原则，a book 是单数，所以用 is。'
        },
        {
          id: 3,
          content: 'He is ___ honest boy.\nA. a  B. an  C. the  D. /',
          studentAnswer: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          explanation: 'honest 的 h 不发音，以元音音素开头，前面用 an。'
        },
        {
          id: 4,
          content: 'I ___ my homework when he called me.\nA. do  B. did  C. was doing  D. am doing',
          studentAnswer: 'A',
          correctAnswer: 'C',
          isCorrect: false,
          explanation: '"when he called me" 表示过去某个时刻，主句用过去进行时 was doing，表示当时正在做某事。'
        },
        {
          id: 5,
          content: 'The movie is ___ interesting ___ I want to watch it again.\nA. so; that  B. such; that  C. too; to  D. very; that',
          studentAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          explanation: 'so + 形容词 + that + 从句，表示"如此...以至于..."。interesting 是形容词，用 so。'
        }
      ]
    }
  }
};