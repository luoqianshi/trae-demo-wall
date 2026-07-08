// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const mockPaperResult = {
  paperName: '三年级数学第三单元测试',
  totalScore: 100,
  score: 82,
  totalQuestions: 23,
  correctCount: 18,
  wrongCount: 5,
  tags: ['计算薄弱', '概念不清'],
  wrongQuestions: [
    {
      id: 1,
      questionNum: 2,
      question: '一个长方形的长是8cm，宽是5cm，它的面积是多少平方厘米？',
      type: '选择题',
      myAnswer: 'B. 26cm²',
      correctAnswer: 'C. 40cm²',
      knowledgePoints: ['长方形面积', '周长与面积混淆'],
      reason: '概念不清',
      analysis: '长方形面积 = 长 × 宽 = 8 × 5 = 40cm²。误选26是计算了周长(8+5)×2=26，需区分周长和面积公式。'
    },
    {
      id: 2,
      questionNum: 5,
      question: '计算: 25 × 4 ÷ 25 × 4 = ?',
      type: '计算题',
      myAnswer: 'A. 1',
      correctAnswer: 'D. 16',
      knowledgePoints: ['乘除混合运算', '运算顺序'],
      reason: '粗心错误',
      analysis: '乘除是同级运算，应从左到右依次计算：25×4=100, 100÷25=4, 4×4=16。不能先算两边再相除。'
    },
    {
      id: 3,
      questionNum: 8,
      question: '正方形的边长扩大3倍，面积扩大多少倍？',
      type: '选择题',
      myAnswer: 'B. 3倍',
      correctAnswer: 'C. 9倍',
      knowledgePoints: ['正方形面积', '面积变化规律'],
      reason: '概念不清',
      analysis: '正方形面积 = 边长 × 边长。边长扩大3倍，面积扩大3×3=9倍。注意区分边长变化和面积变化的关系。'
    },
    {
      id: 4,
      questionNum: 12,
      question: '一个正方形花坛周长是36米，它的面积是多少平方米？',
      type: '应用题',
      myAnswer: '81平方米（计算错误写成72）',
      correctAnswer: '81平方米',
      knowledgePoints: ['正方形周长', '正方形面积', '周长面积综合'],
      reason: '计算错误',
      analysis: '先求边长：36 ÷ 4 = 9米，再求面积：9 × 9 = 81平方米。注意运算准确。'
    },
    {
      id: 5,
      questionNum: 18,
      question: '用一根长24厘米的铁丝围成一个长方形，长是8厘米，宽是多少厘米？',
      type: '应用题',
      myAnswer: '4厘米（计算错误）',
      correctAnswer: '4厘米',
      knowledgePoints: ['长方形周长', '周长逆运算'],
      reason: '粗心错误',
      analysis: '长方形周长 = (长 + 宽) × 2，所以宽 = 周长÷2 - 长 = 24÷2 - 8 = 12 - 8 = 4厘米。答案正确但过程有疏漏。'
    }
  ],
  knowledgeAnalysis: {
    radarData: [
      { name: '长方形', value: 75 },
      { name: '正方形', value: 60 },
      { name: '面积计算', value: 40 },
      { name: '混合运算', value: 35 },
      { name: '周长', value: 70 }
    ],
    weakPoints: [
      { name: '面积变化规律', score: 30, rank: 1 },
      { name: '乘除混合运算', score: 50, rank: 2 },
      { name: '周长与面积区分', score: 65, rank: 3 },
      { name: '正方形面积公式', score: 70, rank: 4 },
      { name: '应用题审题', score: 75, rank: 5 }
    ],
    reasonDistribution: [
      { name: '概念不清', count: 3, color: '#FF8A33' },
      { name: '粗心错误', count: 2, color: '#2CC8B8' },
      { name: '计算错误', count: 1, color: '#5B8DEF' },
      { name: '审题失误', count: 0, color: '#B388FF' }
    ]
  },
  studyPlan: {
    title: '3天攻克薄弱点',
    description: '针对面积计算、混合运算两大薄弱项，定制阶梯式训练计划',
    targets: [
      { name: '面积变化规律', from: 30, to: 80 },
      { name: '乘除混合运算', from: 50, to: 85 },
      { name: '周长面积区分', from: 65, to: 90 }
    ],
    exercises: [
      { id: 1, title: '正方形边长扩大2倍，面积扩大？', type: '面积变化', level: '基础题' },
      { id: 2, title: '36 × 5 ÷ 36 × 5 = ?', type: '混合运算', level: '易错题' },
      { id: 3, title: '长方形周长与面积对比计算', type: '概念辨析', level: '提高题' },
      { id: 4, title: '已知正方形面积求边长', type: '面积逆运算', level: '基础题' },
      { id: 5, title: '120 ÷ 5 × 4 = ?', type: '混合运算', level: '基础题' }
    ],
    schedule: [
      { day: 'Day 1', title: '概念梳理', desc: '面积公式精讲 + 4道基础练习，理清概念误区', color: '#2CC8B8' },
      { day: 'Day 2', title: '专项突破', desc: '易错题专项训练 + 错题复盘，强化薄弱点', color: '#FF8A33' },
      { day: 'Day 3', title: '综合巩固', desc: '混合综合练习 + 知识点串联，验收学习成果', color: '#5B8DEF' }
    ]
  }
}

exports.main = async (event, context) => {
  const { imageUrl, grade, subject } = event

  await new Promise(resolve => setTimeout(resolve, 2000))

  const result = {
    ...mockPaperResult,
    paperName: `${grade}${getSubjectName(subject)}第三单元测试`,
    analyzeTime: new Date().toISOString(),
    imageUrl: imageUrl || ''
  }

  try {
    await db.collection('analyze_records').add({
      data: {
        ...result,
        createdAt: db.serverDate(),
        grade,
        subject
      }
    })
  } catch (e) {
    console.log('保存记录失败:', e)
  }

  return {
    code: 0,
    message: 'success',
    data: result
  }
}

function getSubjectName(subject) {
  const map = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    physics: '物理'
  }
  return map[subject] || '数学'
}
