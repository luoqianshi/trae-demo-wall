/**
 * 模拟数据文件
 * 包含10道以上错题数据，覆盖数学、语文、英语、科学等学科
 */

// 学科枚举
const SUBJECTS = {
  MATH: '数学',
  CHINESE: '语文',
  ENGLISH: '英语',
  SCIENCE: '科学'
}

// 学科对应颜色
const SUBJECT_COLORS = {
  '数学': '#27ae60',
  '语文': '#e74c3c',
  '英语': '#3498db',
  '科学': '#f39c12'
}

// 模拟错题数据
const mockData = [
  // ========== 数学题 (5道) ==========
  {
    id: 1,
    subject: '数学',
    knowledgePoint: '小数乘法',
    question: '计算：3.6 × 2.5 = ?',
    myAnswer: '8.5',
    correctAnswer: '9.0',
    analysis: '小数乘法时，先按整数乘法计算 36 × 25 = 900，因为两个因数共有2位小数，所以从右边数2位点上小数点，得到 9.00，即 9.0。',
    wrongCount: 2,
    reviewDates: ['2026-06-10', '2026-06-15'],
    graduated: false
  },
  {
    id: 2,
    subject: '数学',
    knowledgePoint: '小数除法',
    question: '计算：7.2 ÷ 0.8 = ?',
    myAnswer: '0.9',
    correctAnswer: '9',
    analysis: '小数除法时，先把除数变成整数：0.8 × 10 = 8，被除数也要乘10：7.2 × 10 = 72，然后计算 72 ÷ 8 = 9。注意：被除数和除数要同时扩大相同的倍数。',
    wrongCount: 3,
    reviewDates: ['2026-06-08', '2026-06-12', '2026-06-16'],
    graduated: false
  },
  {
    id: 3,
    subject: '数学',
    knowledgePoint: '分数通分',
    question: '把 2/3 和 3/4 通分。',
    myAnswer: '8/12 和 9/12',
    correctAnswer: '8/12 和 9/12',
    analysis: '先找3和4的最小公倍数：3×4=12。然后把 2/3 的分子分母同乘4得到 8/12，把 3/4 的分子分母同乘3得到 9/12。注意：这道题其实你做对了哦！可能是粗心标记错了。',
    wrongCount: 1,
    reviewDates: ['2026-06-14'],
    graduated: true
  },
  {
    id: 4,
    subject: '数学',
    knowledgePoint: '应用题',
    question: '小明有36颗糖，小红的糖是小明的2/3，小红有多少颗糖？',
    myAnswer: '24颗',
    correctAnswer: '24颗',
    analysis: '求一个数的几分之几是多少，用乘法计算：36 × 2/3 = 36 ÷ 3 × 2 = 12 × 2 = 24颗。你做对了！',
    wrongCount: 1,
    reviewDates: ['2026-06-11'],
    graduated: true
  },
  {
    id: 5,
    subject: '数学',
    knowledgePoint: '解方程',
    question: '解方程：3x + 5 = 20',
    myAnswer: 'x = 4',
    correctAnswer: 'x = 5',
    analysis: '解方程步骤：\n① 先把等式两边减5：3x + 5 - 5 = 20 - 5，得到 3x = 15\n② 再把等式两边除以3：3x ÷ 3 = 15 ÷ 3，得到 x = 5\n③ 验算：3×5 + 5 = 15 + 5 = 20 ✓',
    wrongCount: 2,
    reviewDates: ['2026-06-09', '2026-06-17'],
    graduated: false
  },

  // ========== 语文题 (5道) ==========
  {
    id: 6,
    subject: '语文',
    knowledgePoint: '易错字',
    question: '下列词语中，没有错别字的一组是：\nA. 再接再厉  B. 走头无路  C. 默默无蚊  D. 名列前矛',
    myAnswer: 'B',
    correctAnswer: 'A',
    analysis: '正确答案是A"再接再厉"。\nB应为"走投无路"（投，不是头）\nC应为"默默无闻"（闻，不是蚊）\nD应为"名列前茅"（茅，不是矛）\n\n记忆口诀：走投无路——投靠无门；名列前茅——茅草屋前。',
    wrongCount: 3,
    reviewDates: ['2026-06-07', '2026-06-13', '2026-06-18'],
    graduated: false
  },
  {
    id: 7,
    subject: '语文',
    knowledgePoint: '关联词',
    question: '用合适的关联词填空：\n（____）天气很冷，（____）小明仍然坚持早起锻炼。',
    myAnswer: '虽然……但是……',
    correctAnswer: '虽然……但是……',
    analysis: '"虽然……但是……"表示转折关系。虽然天气条件不好（冷），但是小明还是坚持了锻炼。你做对了！\n\n其他关联词类型：\n- 因果关系：因为……所以……\n- 条件关系：只要……就……\n- 递进关系：不但……而且……',
    wrongCount: 1,
    reviewDates: ['2026-06-12'],
    graduated: true
  },
  {
    id: 8,
    subject: '语文',
    knowledgePoint: '修辞手法',
    question: '"春风又绿江南岸，明月何时照我还"中，"绿"字用得好在哪里？',
    myAnswer: '"绿"字让句子更好看。',
    correctAnswer: '"绿"字把春风拟人化了，化静为动，写出了春风吹过之后江南一片生机勃勃的景象。',
    analysis: '这是一个经典的"炼字"题。"绿"字的妙处：\n① 拟人手法——春风像人一样，给江南岸"穿"上了绿装\n② 化静为动——把静态的颜色变成了动态的过程\n③ 生动形象——让人仿佛看到春天到来的画面\n\n答题模板：运用了___手法，写出了___的特点，表达了___的情感。',
    wrongCount: 2,
    reviewDates: ['2026-06-10', '2026-06-16'],
    graduated: false
  },
  {
    id: 9,
    subject: '语文',
    knowledgePoint: '古诗默写',
    question: '补全诗句：床前明月光，______。',
    myAnswer: '疑是地上霜',
    correctAnswer: '疑是地上霜',
    analysis: '出自李白的《静夜思》：\n床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n\n全诗表达了诗人对故乡的思念之情。"疑"是"好像"的意思，月光洒在地上，好像一层白霜。',
    wrongCount: 1,
    reviewDates: ['2026-06-15'],
    graduated: true
  },
  {
    id: 10,
    subject: '语文',
    knowledgePoint: '修改病句',
    question: '修改下面的病句：\n"我们要养成认真审题的好习惯。"',
    myAnswer: '这句话没有语病。',
    correctAnswer: '这句话没有语病。',
    analysis: '这句话确实没有语病！主语"我们"，谓语"养成"，宾语"好习惯"，搭配正确，语意完整。\n\n常见病句类型：\n① 成分残缺：通过学习，使我进步了。（缺主语）\n② 搭配不当：他的写作水平明显改进了。（"水平"应搭配"提高"）\n③ 语序不当：我们要认真克服并善于发现缺点。',
    wrongCount: 1,
    reviewDates: ['2026-06-14'],
    graduated: true
  }
]

/**
 * 获取薄弱知识点统计（TOP5）
 * @param {Array} questions 错题列表
 * @returns {Array} TOP5薄弱知识点
 */
function getWeakPoints(questions) {
  const pointMap = {}
  questions.forEach(q => {
    if (!q.graduated && pointMap[q.knowledgePoint]) {
      pointMap[q.knowledgePoint] += q.wrongCount
    } else if (!q.graduated) {
      pointMap[q.knowledgePoint] = q.wrongCount
    }
  })
  
  // 排序取TOP5
  const sorted = Object.entries(pointMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return sorted
}

/**
 * 根据学科筛选错题
 * @param {Array} questions 错题列表
 * @param {String} subject 学科名称
 * @returns {Array} 筛选后的错题
 */
function filterBySubject(questions, subject) {
  if (!subject || subject === '全部') {
    return questions
  }
  return questions.filter(q => q.subject === subject)
}

/**
 * 获取学习统计
 * @param {Array} questions 错题列表
 * @returns {Object} 统计数据
 */
function getStats(questions) {
  const total = questions.length
  const graduated = questions.filter(q => q.graduated).length
  const notGraduated = total - graduated
  const subjects = [...new Set(questions.map(q => q.subject))]
  
  return {
    total,
    graduated,
    notGraduated,
    subjects
  }
}

module.exports = {
  mockData,
  SUBJECTS,
  SUBJECT_COLORS,
  getWeakPoints,
  filterBySubject,
  getStats
}
