/**
 * 豆包 AI 图片识别 - 火山方舟视觉理解模型
 * 
 * 架构说明：
 * - 开发环境：通过 Vite 代理转发到火山方舟 API，避免 CORS 和前端暴露 API Key
 * - 生产环境：需要配置后端代理接口，例如 /api/doubao/ocr
 * - API Key 保存在环境变量中，不写入前端代码
 */

export function buildDoubaoOCRPrompt() {
  return `
你是一名高中学习错题识别助手。请从学生上传的错题图片中识别并提取结构化信息。

你的任务不是解题，而是完成错题录入前的信息提取。

请识别以下内容：
1. 科目：只能从 数学、物理、化学、生物、英语 中选择；
2. 知识点：尽量用高中教材常见知识点表述；
3. 题目内容：完整提取题干、条件、问题，保留所有标点符号、数字、公式、选项编号；
4. 学生错误答案：如果图片中有学生作答或错误答案，请提取；
5. 学生可能的困惑：根据题目和错误答案推测；
6. 错误标签建议：从 知识点不会、审题漏条件、公式不会选、思路卡住、计算错误、看懂解析但换题不会 中选择；
7. 原始识别文本：保留图片中识别出的原始文本，包括换行和标点；
8. 识别风险提示：指出哪些地方需要人工确认。

重要格式要求：
- 题目内容必须完整保留所有标点符号（逗号、句号、问号、引号、括号等）；
- 选择题的选项要分行，每个选项单独一行，保留 A. B. C. D. 等编号；
- 数学公式、物理单位、化学方程式要保持原样；
- 数字和符号不能遗漏；
- 题干和选项之间要有适当的换行。

请注意：
- 不要直接给完整解题答案；
- 不要替学生完成作业；
- 如果图片不清晰，请明确提示需要人工确认；
- 如果题目有公式、坐标、单位、化学方程式、生物概念或英语句子，请尽量保持原格式；
- 最终只返回 JSON，不要返回 Markdown，不要返回解释性文字。

返回 JSON 格式：
{
  "subject": "",
  "knowledgePoint": "",
  "questionText": "",
  "wrongAnswer": "",
  "confusion": "",
  "errorTags": [],
  "extractedText": "",
  "confidence": 0,
  "needHumanCheck": true,
  "warnings": []
}
`
}

/**
 * 调用豆包大模型进行错题图片识别
 * 支持单图或多图识别（用于识别题目文字+图形）
 *
 * @param {File|File[]} imageFiles - 单张图片或多张图片数组
 * @returns {Promise<Object>} 结构化的错题识别结果
 */
export async function callDoubaoForQuestionOCR(imageFiles) {
  const apiKey = import.meta.env.VITE_DOUBAO_API_KEY
  const modelEndpoint = import.meta.env.VITE_DOUBAO_MODEL_ENDPOINT

  // 统一为数组
  const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles]

  // 如果没有配置 API Key，降级使用 Mock
  if (!apiKey || !modelEndpoint || apiKey === 'your-api-key-here') {
    console.warn('[豆包OCR] 未配置 API Key，使用 Mock 模式')
    return mockExtractQuestionFromImage(files[0])
  }

  try {
    // 将所有图片转换为 base64
    const imageContents = await Promise.all(
      files.map(async (file) => {
        const base64 = await fileToBase64(file)
        return {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64}`
          }
        }
      })
    )

    const apiBase = import.meta.env.VITE_DOUBAO_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3'
    const isDev = import.meta.env.DEV
    const apiUrl = isDev ? '/api/doubao/chat/completions' : `${apiBase}/chat/completions`
    
    const headers = {
      'Content-Type': 'application/json'
    }
    if (!isDev) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelEndpoint,
        messages: [
          {
            role: 'system',
            content: buildDoubaoOCRPrompt()
          },
          {
            role: 'user',
            content: [
              ...imageContents,
              {
                type: 'text',
                text: files.length > 1
                  ? `请识别这 ${files.length} 张图片中的内容，这些图片包含同一道题目的不同部分（如文字描述和图形图示），请将它们整合后严格按照要求返回 JSON 格式。`
                  : '请识别这张错题图片中的内容，严格按照要求返回JSON格式。'
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2048
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 返回格式异常')
    }

    const content = data.choices[0].message.content
    const parsed = parseJSONResponse(content)

    return {
      ...parsed,
      needHumanCheck: true,
      rawResponse: content,
      _imageCount: files.length // 记录图片数量，用于调试
    }

  } catch (error) {
    console.error('[豆包OCR] 调用失败:', error)

    // 如果是网络错误或代理未配置，降级到 mock
    if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
      console.warn('[豆包OCR] 网络/代理异常，降级使用 Mock')
      return mockExtractQuestionFromImage(files[0])
    }

    throw error
  }
}

/**
 * 解析 AI 返回的 JSON，处理可能的 Markdown 包裹或额外文本
 */
function parseJSONResponse(content) {
  // 尝试直接解析
  try {
    return JSON.parse(content)
  } catch (e) {
    // 忽略，继续下面的尝试
  }

  // 尝试提取 ```json ... ``` 块
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1])
    } catch (e) {
      // 继续尝试
    }
  }

  // 尝试提取第一个 { 到最后一个 } 之间的内容
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.substring(firstBrace, lastBrace + 1))
    } catch (e) {
      // 继续
    }
  }

  // 如果都失败了，返回一个带警告的默认结构
  return {
    subject: '数学',
    knowledgePoint: '',
    questionText: '',
    wrongAnswer: '',
    confusion: '',
    errorTags: [],
    extractedText: content,
    confidence: 0.3,
    needHumanCheck: true,
    warnings: ['AI 返回内容无法解析为 JSON，请人工核对并修改']
  }
}

/**
 * Mock 识别结果（降级方案）
 * 当 API 不可用时使用，确保应用仍可正常运行
 */
function mockExtractQuestionFromImage(imageFile) {
  const mockResults = [
    {
      subject: '数学',
      knowledgePoint: '平面向量坐标运算',
      questionText: '已知向量 a = (2, -1)，b = (1, 3)，求 2a - b 的坐标。',
      wrongAnswer: '(3, -5)',
      confusion: '我不确定数乘和减法顺序是不是弄错了。',
      errorTags: ['公式不会选', '计算错误'],
      extractedText: '题目：已知向量 a = (2, -1)，b = (1, 3)，求 2a - b 的坐标。学生答案：(3, -5)。',
      confidence: 0.92,
      needHumanCheck: true,
      warnings: ['当前为 Mock 模式，结果为示例数据']
    },
    {
      subject: '物理',
      knowledgePoint: '牛顿第二定律',
      questionText: '质量为 2kg 的物体受到 10N 的水平拉力，求物体的加速度。',
      wrongAnswer: 'a = 5m/s²',
      confusion: '我算出来了，但是不确定单位是否正确。',
      errorTags: ['计算错误'],
      extractedText: '质量 m=2kg，拉力 F=10N，求加速度 a。',
      confidence: 0.88,
      needHumanCheck: true,
      warnings: ['当前为 Mock 模式，结果为示例数据']
    },
    {
      subject: '化学',
      knowledgePoint: '离子反应方程式',
      questionText: '写出氯化铁溶液与氢氧化钠溶液反应的离子方程式。',
      wrongAnswer: 'Fe³⁺ + 3OH⁻ = Fe(OH)₃↓',
      confusion: '我不知道什么时候该拆成离子，什么时候不该拆。',
      errorTags: ['知识点不会', '公式不会选'],
      extractedText: '氯化铁溶＋氢氧化钠溶 → ？',
      confidence: 0.75,
      needHumanCheck: true,
      warnings: ['当前为 Mock 模式，结果为示例数据']
    }
  ]

  const randomIndex = Math.floor(Math.random() * mockResults.length)
  return { ...mockResults[randomIndex], timestamp: Date.now() }
}

/**
 * 将 File 对象转换为 base64 字符串
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = error => reject(error)
  })
}

/**
 * 通用豆包 API 调用函数
 */
async function callDoubaoAPI(systemPrompt, userMessage, maxTokens = 2048) {
  const apiKey = import.meta.env.VITE_DOUBAO_API_KEY
  const modelEndpoint = import.meta.env.VITE_DOUBAO_MODEL_ENDPOINT

  if (!apiKey || !modelEndpoint || apiKey === 'your-api-key-here') {
    return null
  }

  try {
    const apiBase = import.meta.env.VITE_DOUBAO_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3'
    const isDev = import.meta.env.DEV
    const apiUrl = isDev ? '/api/doubao/chat/completions' : `${apiBase}/chat/completions`
    
    const headers = {
      'Content-Type': 'application/json'
    }
    if (!isDev) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelEndpoint,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 返回格式异常')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('[豆包API] 调用失败:', error)
    return null
  }
}

/**
 * AI 错因诊断
 */
export async function callDoubaoForDiagnosis(wrongQuestion) {
  const systemPrompt = `
你是一名经验丰富的高中学习辅导老师。请根据学生的错题信息，进行精准的错因诊断。

请从以下维度分析：
1. 错因类型：用一句话概括根本原因
2. 可能原因：列出 2-3 个具体的可能原因
3. 复习建议：给出针对性的复习建议
4. 推荐训练：推荐应该做什么样的练习

注意：
- 诊断要具体，不要太笼统
- 语言要鼓励，不要打击学生
- 只返回 JSON 格式

返回 JSON 格式：
{
  "causeType": "",
  "possibleReasons": [],
  "reviewSuggestion": "",
  "recommendedTraining": "",
  "confidence": 0.85
}
`

  const userMessage = `
科目：${wrongQuestion.subject}
知识点：${wrongQuestion.knowledgePoint}
题目内容：${wrongQuestion.questionText}
学生错误答案：${wrongQuestion.wrongAnswer || '未提供'}
学生困惑：${wrongQuestion.confusion || '未提供'}
错误标签：${(wrongQuestion.errorTags || []).join('、')}

请给出错因诊断。
`

  const content = await callDoubaoAPI(systemPrompt, userMessage)
  if (!content) return null

  try {
    const parsed = parseJSONResponse(content)
    return parsed
  } catch (e) {
    console.error('[豆包诊断] 解析失败:', e)
    return null
  }
}

/**
 * AI 分步引导
 */
export async function callDoubaoForGuideSteps(wrongQuestion, diagnosis) {
  const systemPrompt = `
你是一名循循善诱的高中辅导老师。你的任务是引导学生一步步解出这道题，而不是直接给答案。

请生成 5-6 个引导步骤，每个步骤：
- 有一个明确的标题
- 内容是提示性的，引导学生思考
- 不要直接给出最终答案
- 最后一步引导学生自己检查答案

注意：
- 步骤要循序渐进，由浅入深
- 语言要像老师在引导学生
- 要针对具体题目，不要泛泛而谈
- 只返回 JSON 格式

返回 JSON 格式：
{
  "guideSteps": [
    {
      "id": "step-1",
      "title": "",
      "content": ""
    }
  ]
}
`

  const userMessage = `
科目：${wrongQuestion.subject}
知识点：${wrongQuestion.knowledgePoint}
题目内容：${wrongQuestion.questionText}
学生错误答案：${wrongQuestion.wrongAnswer || '未提供'}
学生困惑：${wrongQuestion.confusion || '未提供'}

错因诊断：
- 错因类型：${diagnosis?.causeType || '未知'}
- 可能原因：${(diagnosis?.possibleReasons || []).join('、')}

请针对这道具体的题目，生成分步引导。
`

  const content = await callDoubaoAPI(systemPrompt, userMessage, 3000)
  if (!content) return null

  try {
    const parsed = parseJSONResponse(content)
    return parsed.guideSteps || null
  } catch (e) {
    console.error('[豆包引导] 解析失败:', e)
    return null
  }
}

/**
 * AI 变式训练题生成
 */
export async function callDoubaoForVariationQuestions(wrongQuestion, diagnosis) {
  const systemPrompt = `
你是一名经验丰富的高中教研老师。请根据学生的错题，生成 3 道**同类型、同知识点**的变式训练题。

重要要求：
1. 必须和原题是**同一题型**（选择题就出选择题，填空题就出填空题，解答题就出解答题）
2. 必须和原题是**同一知识点、同一难度级别**
3. 3 道题难度递进，但都是同类型：
   - 基础巩固：和原题几乎一样难度，只是换了数字或条件
   - 方法辨析：同类型易错题，帮助辨析易错点
   - 进阶训练：稍微拔高一点，但还是同一题型
4. 每道题都要**完整具体**，有明确的条件和问题，不能有"____"这样的占位符
5. 如果原题是选择题，选项要完整（A、B、C、D）
6. 答案和解析要准确详细
7. **图形描述**：如果题目涉及图形（几何图形、函数图像、物理示意图等），必须用文字详细描述图形的样子，
   包括：图形的形状、各点的位置关系、已知的边长/角度/坐标等关键信息，让学生仅凭文字描述就能想象出图形。

返回 JSON 格式：
{
  "variationQuestions": [
    {
      "type": "基础巩固",
      "question": "",
      "figureDescription": "",
      "answer": "",
      "explanation": ""
    },
    {
      "type": "方法辨析",
      "question": "",
      "figureDescription": "",
      "answer": "",
      "explanation": ""
    },
    {
      "type": "进阶训练",
      "question": "",
      "figureDescription": "",
      "answer": "",
      "explanation": ""
    }
  ]
}

注意：
- figureDescription 字段：如果题目有图形，填写详细的图形文字描述；如果没有图形，填空字符串""。
- 图形描述要足够详细，让学生能在脑海中想象出图形的样子。
`

  const userMessage = `
原题信息：
- 科目：${wrongQuestion.subject}
- 知识点：${wrongQuestion.knowledgePoint}
- 完整题目：
${wrongQuestion.questionText}

学生错误：${wrongQuestion.wrongAnswer || '未提供'}
学生困惑：${wrongQuestion.confusion || '未提供'}

请根据这道原题，生成 3 道同类型的变式训练题。一定要和原题题型相同、知识点相同！
`

  const content = await callDoubaoAPI(systemPrompt, userMessage, 3500)
  if (!content) return null

  try {
    const parsed = parseJSONResponse(content)
    return parsed.variationQuestions || null
  } catch (e) {
    console.error('[豆包变式题] 解析失败:', e)
    return null
  }
}

/**
 * AI 批改学生答题
 */
export async function callDoubaoForGrading(question, studentAnswer, correctAnswer, explanation) {
  const systemPrompt = `
你是一名严格而耐心的高中老师。请批改学生的答题，并给出详细反馈。

你的任务：
1. 判断学生答案是否正确
2. 如果错误，指出具体错在哪里
3. 给出正确的解题思路
4. 语言要鼓励，指出问题的同时给予信心

返回 JSON 格式：
{
  "isCorrect": true/false,
  "score": "0-100分",
  "feedback": "整体评价，鼓励为主",
  "errorAnalysis": "如果错了，具体错在哪里；如果对了，说明好在哪里",
  "correctApproach": "正确的解题思路或方法",
  "keyPoints": ["得分点1", "得分点2"]
}
`

  const userMessage = `
题目：
${question}

正确答案：${correctAnswer}
答案解析：${explanation}

学生的答案：
${studentAnswer}

请批改学生的答案。
`

  const content = await callDoubaoAPI(systemPrompt, userMessage, 2048)
  if (!content) return null

  try {
    const parsed = parseJSONResponse(content)
    return parsed
  } catch (e) {
    console.error('[豆包批改] 解析失败:', e)
    return null
  }
}

/**
 * AI 识别手写答案图片
 */
export async function callDoubaoForHandwritingOCR(imageFile) {
  const apiKey = import.meta.env.VITE_DOUBAO_API_KEY
  const modelEndpoint = import.meta.env.VITE_DOUBAO_MODEL_ENDPOINT

  if (!apiKey || !modelEndpoint || apiKey === 'your-api-key-here') {
    return null
  }

  try {
    const base64 = await fileToBase64(imageFile)

    const systemPrompt = `
你是一名手写体识别助手。学生上传了一张写有解题过程或答案的图片，请识别图片中的所有文字内容。

要求：
1. 完整识别图片中的所有文字，包括解题步骤、公式、答案
2. 保持原有的换行和格式
3. 数学公式尽量用文字描述清楚
4. 即使字迹潦草也要尽量识别
5. 直接返回识别出的纯文本内容，不要加解释，不要加引号
6. 如果图片不清晰或无法识别，返回"无法识别，请手动输入"
`

    const apiBase = import.meta.env.VITE_DOUBAO_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3'
    const isDev = import.meta.env.DEV
    const apiUrl = isDev ? '/api/doubao/chat/completions' : `${apiBase}/chat/completions`
    
    const headers = {
      'Content-Type': 'application/json'
    }
    if (!isDev) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelEndpoint,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              },
              {
                type: 'text',
                text: '请识别这张图片中的解题过程和答案，直接输出识别到的文字。'
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API 返回格式异常')
    }

    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('[豆包手写识别] 调用失败:', error)
    return null
  }
}
