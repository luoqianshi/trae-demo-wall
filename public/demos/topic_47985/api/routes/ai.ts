import express, { type Request, type Response } from 'express'
import OpenAI from 'openai'

const router = express.Router()

interface AnalysisResult {
  personType: string
  confidence: number
  analysis: string
  traits: {
    aggressiveness: number
    sincerity: number
    predictability: number
    senseOfResponsibility: number
    shrewdness: number
    controlDesire: number
  }
  suggestions: string[]
  actionSteps: string[]
}

// AI 分析接口
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { description, apiKey, baseUrl } = req.body

    if (!apiKey) {
      res.status(400).json({
        success: false,
        error: '请先配置 API Key',
      })
      return
    }

    if (!description || description.trim().length < 10) {
      res.status(400).json({
        success: false,
        error: '请输入更详细的描述（至少10个字）',
      })
      return
    }

    // 创建 OpenAI 客户端
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1',
    })

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt()

    // 用户消息
    const userMessage = `用户描述：
${description}

请基于熊太行《识人攻略》和《关系攻略》的理论框架，分析这个人的类型。`

    // 调用 AI
    const model = req.body.model || 'deepseek-v4-pro'
    
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1500,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    })

    const reply = completion.choices[0]?.message?.content || '{}'

    // 解析 JSON
    let result: AnalysisResult
    try {
      result = JSON.parse(reply)
    } catch {
      result = {
        personType: '无法识别',
        confidence: 0,
        analysis: 'AI 返回格式解析失败，请重试',
        traits: {
          aggressiveness: 0,
          sincerity: 0,
          predictability: 0,
          senseOfResponsibility: 0,
          shrewdness: 0,
          controlDesire: 0,
        },
        suggestions: [],
        actionSteps: [],
      }
    }

    res.status(200).json({
      success: true,
      data: result,
      timestamp: Date.now(),
    })
  } catch (error: unknown) {
    console.error('AI analyze error:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    res.status(500).json({
      success: false,
      error: `AI 调用失败: ${errorMessage}`,
    })
  }
})

// 构建系统提示词
function buildSystemPrompt(): string {
  return `你是 EQagent 人际关系分析师，精通熊太行《识人攻略》和《关系攻略》的识人方法。

你的任务是：根据用户描述的人物行为和场景，分析其人格类型和特征。

## 参考的人物类型（来自识人攻略）：

1. **推脱者**：用"公事公办"做挡箭牌，回避改进建议，实际上是怕担责/要利益/刷存在感
2. **伪君子**：爱讲大道理但言行不一，用道德绑架别人，自己无原则
3. **标榜者**：有道德洁癖，空谈道德无行动，目的是控制别人抬高自己
4. **畏祸者**：神色为难，关键时刻退缩，怕得罪人怕担风险
5. **逐利者**：待价而沽，趁火打劫，用困难索取高价
6. **投机者**：宣誓效忠，顺风倒，你得势时来蹭势
7. **鹰派**：咄咄逼人，相信实力，冲动，谜之自信
8. **鸽派**：注重合作，相信真情，害羞，不敢拒绝

## 分析维度（蛛网图6个维度，每个维度1-10分）：

1. **攻击性** (aggressiveness)：是否咄咄逼人、主动攻击
2. **真诚度** (sincerity)：言行是否一致、是否真心
3. **可预测性** (predictability)：行为是否稳定、容易预判
4. **责任心** (senseOfResponsibility)：是否愿意承担责任
5. **心机度** (shrewdness)：是否精于算计、善于伪装
6. **控制欲** (controlDesire)：是否想控制他人、掌控局面

## 输出格式（严格输出JSON，不要任何其他文字）：

{
  "personType": "人物类型名称，如'推脱者'、'鹰派'、'伪君子'等",
  "confidence": 85,
  "analysis": "分析依据和推理过程，200-300字，基于用户描述的具体行为进行分析",
  "traits": {
    "aggressiveness": 3,
    "sincerity": 2,
    "predictability": 6,
    "senseOfResponsibility": 4,
    "shrewdness": 7,
    "controlDesire": 5
  },
  "suggestions": [
    "相处建议1（具体可执行）",
    "相处建议2",
    "相处建议3",
    "相处建议4"
  ],
  "actionSteps": [
    "第一步行动建议（具体怎么做）",
    "第二步行动建议",
    "第三步行动建议"
  ]
}

## 要求：

1. 基于用户描述的具体行为分析，不要凭空猜测
2. 如果信息不足，降低confidence
3. 建议要具体可执行，不要空泛
4. 严格输出JSON格式，不要任何额外文字
5. 使用中文`
}

export default router
