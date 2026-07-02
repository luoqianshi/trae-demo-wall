/**
 * AI Mock Functions - 预留真实 AI 接口位置
 * 
 * 当前版本使用本地模拟逻辑，后续接入真实 AI API 时：
 * 1. 替换 callAIForDiagnosis 函数
 * 2. 替换 callAIForVariationQuestions 函数
 * 3. 替换 callAIForGuideSteps 函数
 */

const ERROR_TAGS_MAPPING = {
  '知识点不会': {
    causeType: '基础知识点掌握不足',
    possibleReasons: ['相关概念理解模糊', '基础定理不熟悉', '知识网络未建立'],
    reviewSuggestion: '建议回归教材，系统复习相关知识点的定义、定理和典型例题。',
    recommendedTraining: '基础概念辨析题练习'
  },
  '审题漏条件': {
    causeType: '审题信息提取不足',
    possibleReasons: ['阅读习惯不好', '关键信息识别能力弱', '条件遗漏导致思路偏差'],
    reviewSuggestion: '建议每道题先圈出关键词、已知条件和隐藏条件，再开始计算。',
    recommendedTraining: '审题专项训练'
  },
  '公式不会选': {
    causeType: '公式选择错误',
    possibleReasons: ['公式适用范围不清晰', '条件与公式匹配能力弱', '公式记忆混淆'],
    reviewSuggestion: '建议先复习公式适用条件，理解公式背后的逻辑，而不是死记硬背。',
    recommendedTraining: '公式选择判断题练习'
  },
  '思路卡住': {
    causeType: '解题路径不清晰',
    possibleReasons: ['没有找到解题突破口', '已知条件无法有效转化', '缺乏解题经验'],
    reviewSuggestion: '建议分析已知条件和问题目标之间的联系，尝试从结论倒推。',
    recommendedTraining: '典型解题思路归纳'
  },
  '计算错误': {
    causeType: '计算过程不稳定',
    possibleReasons: ['符号处理有误', '中间步骤跳步', '草稿不规范'],
    reviewSuggestion: '建议保留中间计算步骤，养成检查符号、单位和结果合理性的习惯。',
    recommendedTraining: '计算过程规范化训练'
  },
  '看懂解析但换题不会': {
    causeType: '题型迁移能力不足',
    possibleReasons: ['只会模仿不懂变通', '没有掌握核心方法', '题型归纳能力弱'],
    reviewSuggestion: '建议减少机械刷题，增加同类题归纳和变式训练，理解方法而非记住解法。',
    recommendedTraining: '变式题组训练'
  }
}

export function generateDiagnosis(wrongQuestion) {
  // TODO: 后续可在这里接入真实 AI 错因诊断 API
  // async function callAIForDiagnosis(wrongQuestion) {
  //   const response = await fetch('/api/ai/diagnosis', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(wrongQuestion)
  //   })
  //   return response.json()
  // }

  const { errorTags = [] } = wrongQuestion
  const primaryTag = errorTags[0] || '思路卡住'
  const mapping = ERROR_TAGS_MAPPING[primaryTag] || ERROR_TAGS_MAPPING['思路卡住']

  return {
    causeType: mapping.causeType,
    possibleReasons: mapping.possibleReasons,
    reviewSuggestion: mapping.reviewSuggestion,
    recommendedTraining: mapping.recommendedTraining,
    confidence: 0.85
  }
}

export function generateGuideSteps(wrongQuestion, diagnosis) {
  // TODO: 后续可在这里接入真实 AI 分步引导 API
  // async function callAIForGuideSteps(wrongQuestion, diagnosis) {
  //   const response = await fetch('/api/ai/guide', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ wrongQuestion, diagnosis })
  //   })
  //   return response.json()
  // }

  const { subject, knowledgePoint, questionText } = wrongQuestion

  const baseSteps = [
    {
      title: '识别核心知识点',
      content: `本题涉及的核心知识点是「${knowledgePoint}」。请先回忆相关定义和定理。`
    },
    {
      title: '圈出已知条件和问题目标',
      content: '仔细读题，圈出题目给出的所有已知条件，明确最后要解决的问题是什么。'
    },
    {
      title: '选择适合的公式或方法',
      content: `根据「${knowledgePoint}」，选择合适的解题公式或方法。注意公式的适用条件。`
    },
    {
      title: '完成关键计算或推理',
      content: '按照选定的方法，逐步进行计算或推理。建议保留中间步骤，便于检查。'
    },
    {
      title: '检查答案',
      content: '完成后检查：符号是否正确、单位是否匹配、结果是否符合常理。然后重新思考本题。'
    }
  ]

  const subjectSpecific = {
    '数学': [
      { title: '注意计算细节', content: '向量运算时注意：数乘分配律 (k+l)a = ka + la, k(a+b) = ka + kb，但减法不满足分配律。' },
      { title: '检验结果', content: '向量坐标运算后，检查每个分量的符号和数值是否正确。' }
    ],
    '物理': [
      { title: '注意单位统一', content: '检查所有物理量的单位是否统一，必要时进行单位换算。' },
      { title: '验证合理性', content: '检查计算结果的数量级是否合理，是否符合物理定律。' }
    ],
    '化学': [
      { title: '检查守恒定律', content: '原子个数、电荷、电子得失是否守恒。' },
      { title: '注意条件标注', content: '检查反应条件、沉淀气体符号是否标注正确。' }
    ],
    '生物': [
      { title: '回归概念', content: '用生物学核心概念检验答案是否合理。' },
      { title: '注意限定词', content: '题目中的"都""仅""主要"等限定词会影响答案。' }
    ],
    '英语': [
      { title: '分析句子结构', content: '划分句子成分，找出主谓宾，理解语法关系。' },
      { title: '注意语境', content: '结合上下文语境理解词义，注意一词多义。' }
    ]
  }

  const additionalSteps = subjectSpecific[subject] || []
  const allSteps = [...baseSteps, ...additionalSteps]

  return allSteps.map((step, index) => ({
    ...step,
    id: `step-${index + 1}`
  }))
}

export function generateVariationQuestions(wrongQuestion, diagnosis) {
  // TODO: 后续可在这里接入真实 AI 变式题生成 API
  // async function callAIForVariationQuestions(wrongQuestion, diagnosis) {
  //   const response = await fetch('/api/ai/variation', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ wrongQuestion, diagnosis })
  //   })
  //   return response.json()
  // }

  const { subject, knowledgePoint, questionText } = wrongQuestion

  const variationTemplates = {
    '数学': {
      '平面向量坐标运算': [
        {
          type: '基础巩固',
          question: '已知 a = (1, 2)，b = (3, -1)，求 3a - b 的坐标。',
          answer: '(0, 7)',
          explanation: '3a = (3, 6)，3a - b = (3-3, 6-(-1)) = (0, 7)'
        },
        {
          type: '方法辨析',
          question: '判断 2a - b 和 2(a - b) 是否一定相同，并说明理由。',
          answer: '不相同。因为 2(a-b) = 2a - 2b，与 2a - b 不同（除非 b=0）',
          explanation: '关键在于：减法不满足分配律，k(a-b) = ka - kb，但 a-b 不能分配给系数'
        },
        {
          type: '进阶训练',
          question: '已知 2a - b = (5, 1)，a = (2, 3)，求 b。',
          answer: 'b = (-1, 5)',
          explanation: '由 2a - b = (5,1) 得 b = 2a - (5,1) = (4,6) - (5,1) = (-1, 5)'
        }
      ],
      'default': [
        {
          type: '基础巩固',
          question: `${knowledgePoint} 相关基础题：已知条件，求______。`,
          answer: '根据公式计算得出',
          explanation: '应用本节核心公式进行计算'
        },
        {
          type: '方法辨析',
          question: `判断以下做法是否正确：______，并说明理由。`,
          answer: '正确/不正确，因为______',
          explanation: '需要理解公式的适用条件和正确用法'
        },
        {
          type: '进阶训练',
          question: `综合运用：已知______，证明/求______。`,
          answer: '略',
          explanation: '需要综合运用多个知识点和解题技巧'
        }
      ]
    },
    '物理': {
      'default': [
        {
          type: '基础巩固',
          question: `${knowledgePoint} 基础题：已知物体质量m=2kg，受到F=10N的力，求加速度。`,
          answer: 'a = F/m = 5 m/s²',
          explanation: '直接应用牛顿第二定律 F=ma'
        },
        {
          type: '方法辨析',
          question: '判断：如果力变为原来的2倍，加速度是否也变为原来的2倍？',
          answer: '是的，因为 a ∝ F（当质量不变时）',
          explanation: '加速度与力成正比，与质量成反比'
        },
        {
          type: '进阶训练',
          question: '质量为3kg的物体，受到两个力 F1=6N、F2=4N 作用，求加速度大小。',
          answer: '需要知道两个力的方向关系才能确定',
          explanation: '合力决定加速度，需要考虑力的矢量性'
        }
      ]
    },
    '化学': {
      'default': [
        {
          type: '基础巩固',
          question: `${knowledgePoint} 相关：书写离子方程式______。`,
          answer: '______',
          explanation: '注意电荷守恒和原子守恒'
        },
        {
          type: '方法辨析',
          question: '判断以下离子方程式是否正确，并说明原因。',
          answer: '正确/错误，因为______',
          explanation: '检查是否遵循离子反应的条件'
        },
        {
          type: '进阶训练',
          question: '综合题：给定反应物，求产物并书写离子方程式。',
          answer: '略',
          explanation: '需要理解反应原理和离子反应规律'
        }
      ]
    },
    '生物': {
      'default': [
        {
          type: '基础巩固',
          question: `${knowledgePoint} 基础题：选择题或填空题。`,
          answer: '______',
          explanation: '考查基本概念和事实'
        },
        {
          type: '方法辨析',
          question: '判断以下说法是否正确，并解释原因。',
          answer: '正确/错误，因为______',
          explanation: '需要准确理解概念内涵'
        },
        {
          type: '进阶训练',
          question: '分析题：给定情境，分析原因和结果。',
          answer: '略',
          explanation: '需要综合运用生物学知识进行分析'
        }
      ]
    },
    '英语': {
      'default': [
        {
          type: '基础巩固',
          question: `${knowledgePoint} 基础题：选择正确选项。`,
          answer: '______',
          explanation: '考查基本用法和搭配'
        },
        {
          type: '方法辨析',
          question: '辨析以下词语/语法的区别：______。',
          answer: '区别在于______',
          explanation: '需要理解词语/语法的使用场景'
        },
        {
          type: '进阶训练',
          question: '翻译或写作：运用本节知识点造句。',
          answer: '略',
          explanation: '需要在语境中正确运用所学'
        }
      ]
    }
  }

  const subjectTemplates = variationTemplates[subject] || variationTemplates['数学']
  const questions = subjectTemplates[knowledgePoint] || subjectTemplates['default']

  return questions.map((q, index) => ({
    ...q,
    id: `v-${Date.now()}-${index}`,
    userStatus: '未完成'
  }))
}

export function generateReviewPlan(wrongQuestion) {
  // TODO: 后续可在这里接入真实 AI 复习计划生成 API
  // async function callAIForReviewPlan(wrongQuestion) {
  //   const response = await fetch('/api/ai/review-plan', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(wrongQuestion)
  //   })
  //   return response.json()
  // }

  const today = new Date()
  const taskTypes = [
    { taskType: '当天订正', days: 0 },
    { taskType: '3天后复测', days: 3 },
    { taskType: '7天后综合复习', days: 7 },
    { taskType: '考前复习', days: null }
  ]

  return taskTypes.map((item, index) => {
    let reviewDate
    if (item.days === null) {
      reviewDate = '考前'
    } else {
      const date = new Date(today)
      date.setDate(date.getDate() + item.days)
      reviewDate = date.toISOString().split('T')[0]
    }

    return {
      id: `r-${wrongQuestion.id}-${index}`,
      wrongQuestionId: wrongQuestion.id,
      reviewDate,
      taskType: item.taskType,
      status: item.days === 0 ? '已完成' : '未完成',
      createdAt: today.toISOString()
    }
  })
}

export function getLearningSuggestions(wrongQuestions) {
  if (wrongQuestions.length === 0) {
    return {
      primaryIssue: null,
      suggestion: '还没有错题记录，建议先录入一道错题开始学习。'
    }
  }

  const statusCounts = {
    '未诊断': 0,
    '已诊断': 0,
    '引导中': 0,
    '变式训练中': 0,
    '待复测': 0,
    '已掌握': 0
  }

  const causeCounts = {}
  const subjectCounts = {}
  const knowledgePointCounts = {}

  wrongQuestions.forEach(q => {
    statusCounts[q.status] = (statusCounts[q.status] || 0) + 1
    if (q.diagnosis?.causeType) {
      causeCounts[q.diagnosis.causeType] = (causeCounts[q.diagnosis.causeType] || 0) + 1
    }
    if (q.subject) {
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1
    }
    if (q.knowledgePoint) {
      knowledgePointCounts[q.knowledgePoint] = (knowledgePointCounts[q.knowledgePoint] || 0) + 1
    }
  })

  const totalDiagnosed = wrongQuestions.filter(q => q.diagnosis?.causeType).length
  const topCause = totalDiagnosed > 0
    ? Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]
    : null

  const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 2)
  const weakPoints = Object.entries(knowledgePointCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)

  let primaryIssue = null
  let suggestion = ''

  if (topCause) {
    const [cause, count] = topCause
    if (cause.includes('审题')) {
      primaryIssue = '审题信息提取不足'
      suggestion = `你最近的主要问题是审题信息提取不足，建议每道题先圈出关键词、已知条件和隐藏条件，再开始计算。`
    } else if (cause.includes('计算')) {
      primaryIssue = '计算过程不稳定'
      suggestion = `你最近的主要问题是计算过程不稳定，建议保留中间步骤，并养成检查符号、单位和结果合理性的习惯。`
    } else if (cause.includes('公式')) {
      primaryIssue = '公式选择错误'
      suggestion = `你最近的主要问题是公式选择错误，建议先复习公式适用条件，再进行同类变式训练。`
    } else if (cause.includes('迁移')) {
      primaryIssue = '题型迁移能力不足'
      suggestion = `你最近的主要问题是题型迁移能力不足，建议减少机械刷题，增加同类题归纳和变式训练。`
    } else if (cause.includes('知识点')) {
      primaryIssue = '基础知识点掌握不足'
      suggestion = `你最近的主要问题是基础知识点掌握不足，建议回归教材，系统复习相关概念和定理。`
    } else {
      primaryIssue = '解题路径不清晰'
      suggestion = `你最近的主要问题是解题思路不清晰，建议分析已知条件和问题目标之间的联系。`
    }
  }

  return {
    primaryIssue,
    suggestion,
    stats: {
      statusCounts,
      causeCounts,
      subjectCounts,
      knowledgePointCounts,
      topSubjects,
      weakPoints
    }
  }
}
