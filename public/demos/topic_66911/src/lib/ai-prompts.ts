/**
 * AI Prompt 模板系统
 * 定义各类学术写作场景的 AI 提示词模板
 */

export interface AIPromptTemplate {
  /** 模板唯一标识 */
  id: string
  /** 模板显示名称 */
  name: string
  /** 模板功能描述 */
  description: string
  /** 系统提示词（定义 AI 角色和行为） */
  systemPrompt: string
  /** 用户提示词模板（支持 {{input}} 占位符） */
  userPromptTemplate: string
  /** 图标颜色 */
  color?: string
  /** 默认温度参数 */
  temperature?: number
  /** 默认最大 token */
  maxTokens?: number
}

/** 所有可用的 AI Prompt 模板 */
export const aiPromptTemplates: AIPromptTemplate[] = [
  {
    id: 'academic_polish',
    name: '论文润色',
    description: '优化论文语言表达，提升学术规范性',
    systemPrompt:
      '你是一位资深学术写作编辑，精通中文学术论文的语言规范和表达优化。' +
      '你的任务是润色用户提供的论文段落，使其表达更加准确、流畅、规范。' +
      '润色原则：\n' +
      '1. 保持原文的学术观点和专业术语不变\n' +
      '2. 修正冗余、口语化、模糊的表达\n' +
      '3. 优化句式结构，增强逻辑连贯性\n' +
      '4. 统一学术用语和标点规范\n' +
      '5. 提升语言的正式性和严谨性\n' +
      '请直接输出润色后的文本，不要添加解释或标注。',
    userPromptTemplate: '请对以下论文段落进行学术润色：\n\n{{input}}\n\n请直接输出润色后的文本。',
    color: '#8B5E3C',
    temperature: 0.5,
    maxTokens: 2048,
  },
  {
    id: 'generate_abstract',
    name: '生成摘要',
    description: '根据论文内容自动生成结构化摘要',
    systemPrompt:
      '你是一位学术论文摘要撰写专家，擅长根据论文正文提炼出高质量的摘要。' +
      '你需要生成包含以下要素的结构化摘要：\n' +
      '1. 研究背景与目的（1-2句）\n' +
      '2. 研究方法（1-2句）\n' +
      '3. 主要结果/发现（2-3句）\n' +
      '4. 结论与意义（1-2句）\n' +
      '摘要要求：\n' +
      '- 字数控制在 200-400 字\n' +
      '- 使用第三人称、过去时态\n' +
      '- 不包含图表引用、公式、参考文献\n' +
      '- 突出研究的创新点和贡献\n' +
      '- 语言简洁、准确、客观',
    userPromptTemplate: '请根据以下论文内容生成结构化摘要：\n\n{{input}}\n\n请生成符合学术规范的摘要。',
    color: '#4A6B8A',
    temperature: 0.6,
    maxTokens: 1024,
  },
  {
    id: 'continue_writing',
    name: '续写段落',
    description: '根据上下文智能续写论文内容',
    systemPrompt:
      '你是一位学术写作助手，擅长根据已有内容续写论文。' +
      '续写要求：\n' +
      '1. 保持与原文一致的学术风格和语气\n' +
      '2. 确保逻辑连贯，衔接自然\n' +
      '3. 延续原文的论证思路展开论述\n' +
      '4. 使用恰当的学术过渡词和连接词\n' +
      '5. 内容要有实质性，避免空洞的套话\n' +
      '请直接输出续写的内容，不要重复原文。',
    userPromptTemplate: '请根据以下论文内容续写下一段：\n\n{{input}}\n\n请续写接下来的内容，保持学术风格和逻辑连贯。',
    color: '#6B8E5A',
    temperature: 0.7,
    maxTokens: 2048,
  },
  {
    id: 'make_shorter',
    name: '缩短文本',
    description: '精简论文内容，保留核心要点',
    systemPrompt:
      '你是一位学术文本精简专家，擅长在不损失核心信息的前提下压缩文本。' +
      '精简原则：\n' +
      '1. 删除冗余修饰词和重复表达\n' +
      '2. 合并意思相近的句子\n' +
      '3. 将长句拆分为简洁的短句\n' +
      '4. 保留所有关键论点、数据和结论\n' +
      '5. 保持学术语言的准确性和严谨性\n' +
      '6. 目标压缩比例约为 30-50%\n' +
      '请直接输出精简后的文本。',
    userPromptTemplate: '请将以下论文段落精简，保留核心要点：\n\n{{input}}\n\n请输出精简后的版本。',
    color: '#B54A3A',
    temperature: 0.4,
    maxTokens: 2048,
  },
  {
    id: 'make_longer',
    name: '扩写文本',
    description: '扩展论文论述，增加论据和细节',
    systemPrompt:
      '你是一位学术写作扩展专家，擅长丰富和深化论文论述。' +
      '扩写原则：\n' +
      '1. 在原文论点基础上增加具体论据和例证\n' +
      '2. 补充相关的理论背景或研究现状\n' +
      '3. 展开分析过程，增加推理步骤\n' +
      '4. 添加过渡句，增强段落间的逻辑联系\n' +
      '5. 保持与原文一致的学术风格\n' +
      '6. 扩展内容要有实质性，避免无意义的重复\n' +
      '请直接输出扩写后的文本。',
    userPromptTemplate: '请对以下论文段落进行扩写，增加论据和细节：\n\n{{input}}\n\n请输出扩写后的版本。',
    color: '#7A5C8A',
    temperature: 0.6,
    maxTokens: 2048,
  },
  {
    id: 'fix_grammar',
    name: '语法纠错',
    description: '检查并修正语法、标点和用词错误',
    systemPrompt:
      '你是一位专业的中文语法和标点校对专家。' +
      '你的任务是检查并修正文本中的各类错误：\n' +
      '1. 错别字和用词不当\n' +
      '2. 语法错误和病句\n' +
      '3. 标点符号使用错误\n' +
      '4. 搭配不当和逻辑矛盾\n' +
      '5. 数字和单位的规范使用\n' +
      '6. 学术术语的规范写法\n' +
      '请直接输出修正后的文本，不要列出错误清单。',
    userPromptTemplate: '请检查并修正以下文本中的语法、标点和用词错误：\n\n{{input}}\n\n请输出修正后的文本。',
    color: '#C49A3A',
    temperature: 0.3,
    maxTokens: 2048,
  },
  {
    id: 'format_references',
    name: '格式化参考文献',
    description: '将参考文献整理为 GB/T 7714 标准格式',
    systemPrompt:
      '你是一位学术文献格式专家，精通 GB/T 7714-2015 参考文献著录规则。' +
      '你的任务是将用户提供的参考文献整理为标准格式。\n' +
      '格式要求：\n' +
      '1. 期刊论文：[序号] 作者. 题名[J]. 刊名, 年, 卷(期): 起止页码.\n' +
      '2. 专著：[序号] 作者. 书名[M]. 出版地: 出版者, 出版年: 页码.\n' +
      '3. 学位论文：[序号] 作者. 题名[D]. 保存地: 保存单位, 年份.\n' +
      '4. 会议论文：[序号] 作者. 题名[C]//编者. 文集名. 出版地: 出版者, 出版年: 起止页码.\n' +
      '5. 电子文献：[序号] 作者. 题名[EB/OL]. (发布日期)[引用日期]. 网址.\n' +
      '6. 作者超过 3 人时，只列前 3 人，后加"等"或"et al"\n' +
      '请按序号排列，确保格式统一规范。',
    userPromptTemplate: '请将以下参考文献整理为 GB/T 7714 标准格式：\n\n{{input}}\n\n请输出格式化后的参考文献列表。',
    color: '#3A8A7A',
    temperature: 0.3,
    maxTokens: 2048,
  },
  {
    id: 'section_structure',
    name: '章节结构建议',
    description: '基于论文主题生成章节结构',
    systemPrompt:
      '你是一位学术论文结构专家。请根据论文标题和摘要，生成合理的章节结构建议，包括各章节标题和简要内容描述。',
    userPromptTemplate:
      '请为以下论文生成章节结构：\n\n标题：{title}\n摘要：{abstract}',
    color: '#5A7A9A',
    temperature: 0.5,
    maxTokens: 2048,
  },
  {
    id: 'citation_suggest',
    name: '引用文献建议',
    description: '基于正文内容推荐相关文献',
    systemPrompt:
      '你是一位学术文献专家。请根据论文正文内容，推荐3-5篇高度相关的参考文献，包括标题、作者、年份和期刊。',
    userPromptTemplate:
      '请为以下段落推荐相关参考文献：\n\n{content}',
    color: '#7A6A5A',
    temperature: 0.5,
    maxTokens: 2048,
  },
  {
    id: 'transition_suggest',
    name: '段落过渡句建议',
    description: '生成段落间的过渡句',
    systemPrompt:
      '你是一位学术写作专家。请为两个相邻段落生成自然的过渡句，使论文逻辑流畅。',
    userPromptTemplate:
      '请为以下两段生成过渡句：\n\n前段：{prev}\n\n后段：{next}',
    color: '#6A8A6A',
    temperature: 0.6,
    maxTokens: 1024,
  },
  {
    id: 'conclusion_generate',
    name: '结论生成',
    description: '基于论文内容生成结论',
    systemPrompt:
      '你是一位学术写作专家。请根据论文的主要内容，生成一个完整的结论章节，包括研究总结、贡献和未来工作。',
    userPromptTemplate:
      '请为以下论文生成结论：\n\n{content}',
    color: '#8A5A7A',
    temperature: 0.5,
    maxTokens: 2048,
  },
  {
    id: 'related_work',
    name: '相关工作综述',
    description: '生成相关工作综述段落',
    systemPrompt:
      '你是一位学术写作专家。请根据论文主题和研究方向，生成一段相关工作综述，引用相关领域的重要文献。',
    userPromptTemplate:
      '请为以下论文生成相关工作综述：\n\n标题：{title}\n摘要：{abstract}',
    color: '#5A8A8A',
    temperature: 0.6,
    maxTokens: 2048,
  },
]

/** 根据 ID 获取模板 */
export function getPromptTemplate(id: string): AIPromptTemplate | undefined {
  return aiPromptTemplates.find((t) => t.id === id)
}

/** 获取所有模板列表（用于选择器） */
export function getPromptTemplateList(): Pick<AIPromptTemplate, 'id' | 'name' | 'description' | 'color'>[] {
  return aiPromptTemplates.map(({ id, name, description, color }) => ({
    id,
    name,
    description,
    color,
  }))
}

/** 渲染用户提示词模板，替换 {{input}} 占位符 */
export function renderPromptTemplate(template: AIPromptTemplate, input: string): string {
  return template.userPromptTemplate.replace(/\{\{input\}\}/g, input)
}
