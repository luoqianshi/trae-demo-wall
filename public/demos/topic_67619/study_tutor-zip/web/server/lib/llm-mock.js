/**
 * Mock LLM —— 无智谱 API key 时的演示降级。
 * 通过关键词匹配预置真题讲解 JSON，让截图能展示真实结构化输出。
 * 接口与 llm-provider.js 的 callLLM 一致：返回 { content, usage, model }。
 */

const MOCK_EXAMPLES = [
  {
    match: /二次函数|f\s*\(x\)|x\^?2(?![\s\S]*y\b)/i,
    output: {
      restatement: '求二次函数 f(x) = x^2 - 4x + 3 的最小值。',
      conditions: ['f(x) = x^2 - 4x + 3'],
      goal: '求 f(x) 的最小值',
      topic: '函数与导数',
      difficulty: '易',
      hint1: '二次函数的最值与开口方向和顶点有关。',
      hint2: '配方法或顶点公式 x = -b/2a。',
      solution_steps: [
        { step: 1, content: 'a=1>0，开口向上，存在最小值', basis: '依据：二次项系数决定开口方向' },
        { step: 2, content: '顶点 x = -(-4)/(2·1) = 2', basis: '依据：顶点横坐标公式 x = -b/2a' },
        { step: 3, content: 'f(2) = 4 - 8 + 3 = -1', basis: '依据：代入求值' }
      ],
      final_answer: '\\boxed{-1}',
      answer_type: 'numeric',
      confidence: 5,
      uncertain_part: ''
    }
  },
  {
    match: /sin|cos|tan|二倍角|三角/i,
    output: {
      restatement: '已知角 α 在第一象限且 sin α = 3/5，求 cos 2α 的值。',
      conditions: ['sin α = 3/5', 'α ∈ (0, π/2)'],
      goal: '求 cos 2α',
      topic: '三角函数',
      difficulty: '中',
      hint1: '看到 2α 想到二倍角公式。',
      hint2: 'cos 2α = 1 - 2 sin²α，或 cos 2α = cos²α - sin²α。',
      solution_steps: [
        { step: 1, content: 'cos 2α = 1 - 2 sin²α', basis: '依据：二倍角公式' },
        { step: 2, content: '= 1 - 2 × (3/5)²', basis: '依据：代入 sin α' },
        { step: 3, content: '= 1 - 18/25 = 7/25', basis: '依据：分式运算' }
      ],
      final_answer: '\\boxed{\\dfrac{7}{25}}',
      answer_type: 'symbolic',
      confidence: 5,
      uncertain_part: ''
    }
  },
  {
    match: /等差|数列|a_n|s_n|前\s*n\s*项/i,
    output: {
      restatement: '等差数列 {a_n} 中，已知 a_1 = 2，公差 d = 3，求前 10 项的和 S_10。',
      conditions: ['a_1 = 2', 'd = 3', 'n = 10'],
      goal: '求 S_10',
      topic: '数列',
      difficulty: '易',
      hint1: '等差数列前 n 项和有现成公式。',
      hint2: 'S_n = n·a_1 + n(n-1)d/2，或先求 a_n 再用 (a_1 + a_n)·n/2。',
      solution_steps: [
        { step: 1, content: 'S_n = n·a_1 + n(n-1)d/2', basis: '依据：等差数列前 n 项和公式' },
        { step: 2, content: 'S_10 = 10·2 + 10·9·3/2', basis: '依据：代入 a_1=2, d=3, n=10' },
        { step: 3, content: '= 20 + 135 = 155', basis: '依据：算术运算' }
      ],
      final_answer: '\\boxed{155}',
      answer_type: 'numeric',
      confidence: 5,
      uncertain_part: ''
    }
  },
  {
    match: /椭圆|椭圆方程|a\^?2.*b\^?2|解析几何/i,
    output: {
      restatement: '求椭圆 x²/25 + y²/9 = 1 的长轴长与离心率。',
      conditions: ['x²/25 + y²/9 = 1'],
      goal: '求长轴长 2a 与离心率 e',
      topic: '解析几何',
      difficulty: '中',
      hint1: '椭圆标准方程中分母大的对应长轴。',
      hint2: 'a²=25, b²=9，c²=a²-b²；离心率 e=c/a。',
      solution_steps: [
        { step: 1, content: 'a²=25 → a=5；b²=9 → b=3', basis: '依据：椭圆标准方程' },
        { step: 2, content: 'c² = a² - b² = 25 - 9 = 16 → c=4', basis: '依据：椭圆几何关系' },
        { step: 3, content: '长轴 2a = 10', basis: '依据：长轴定义' },
        { step: 4, content: '离心率 e = c/a = 4/5', basis: '依据：离心率定义' }
      ],
      final_answer: '\\boxed{10} \\text{ 和 } \\boxed{\\dfrac{4}{5}}',
      answer_type: 'multi',
      confidence: 5,
      uncertain_part: ''
    }
  },
  {
    match: /概率|骰子|摸球|古典/i,
    output: {
      restatement: '一枚均匀骰子连掷两次，求两次点数之和为 7 的概率。',
      conditions: ['均匀骰子', '连掷两次', '求点和=7'],
      goal: 'P(点数之和 = 7)',
      topic: '概率统计',
      difficulty: '中',
      hint1: '古典概型：有利事件数 / 总事件数。',
      hint2: '总事件数 6×6=36；列举点和为 7 的组合。',
      solution_steps: [
        { step: 1, content: '样本空间总数 = 6 × 6 = 36', basis: '依据：乘法原理' },
        { step: 2, content: '点和为 7 的组合：(1,6)(2,5)(3,4)(4,3)(5,2)(6,1) 共 6 种', basis: '依据：枚举' },
        { step: 3, content: 'P = 6/36 = 1/6', basis: '依据：古典概型公式' }
      ],
      final_answer: '\\boxed{\\dfrac{1}{6}}',
      answer_type: 'symbolic',
      confidence: 5,
      uncertain_part: ''
    }
  }
]

function fallback(questionText) {
  return {
    restatement: `复述题意：${String(questionText || '').slice(0, 80)}`,
    conditions: ['题目给出的已知条件'],
    goal: '题目要求的求解/求证目标',
    topic: '其他',
    difficulty: '中',
    hint1: '先识别题目所属章节，回忆相关定义与定理。',
    hint2: '把已知条件与目标建立联系，寻找适用的公式或方法。',
    solution_steps: [
      { step: 1, content: '梳理已知条件与目标', basis: '依据：审题' },
      { step: 2, content: '选择对应章节的标准方法求解', basis: '依据：相关知识' }
    ],
    final_answer: '\\boxed{\\text{待定}}',
    answer_type: 'numeric',
    confidence: 2,
    uncertain_part: 'mock 模式未匹配到预置题型，仅为演示用占位输出。配置 ZHIPU_API_KEY 后可获取真实 AI 讲解。'
  }
}

function pickOutput(questionText) {
  const text = String(questionText || '')
  for (const ex of MOCK_EXAMPLES) {
    if (ex.match.test(text)) return ex.output
  }
  return fallback(text)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callLLMMock(messages, options = {}) {
  // 模拟网络与推理延时，让前端 loading 动画有体感
  await sleep(600 + Math.random() * 400)
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const questionText = lastUser ? lastUser.content.replace(/^题目：/, '').replace(/\n.*$/, '') : ''
  const output = pickOutput(questionText)
  return {
    content: JSON.stringify(output),
    usage: {
      prompt_tokens: 1200,
      completion_tokens: 800,
      total_tokens: 2000
    },
    model: 'mock-glm-4-plus'
  }
}

module.exports = {
  callLLMMock,
  pickOutput,
  MOCK_EXAMPLES
}
