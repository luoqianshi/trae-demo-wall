export interface AgentCoreMemory {
  name: string
  description: string
  role: string
  instructions: string
  personality?: string
  constraints?: string[]
}

export interface Agent {
  id: string
  name: string
  description: string
  avatar: string
  status: 'active' | 'inactive' | 'training'
  workflowId?: string
  workflowName?: string
  knowledgeBaseId?: string
  knowledgeBaseName?: string
  modelName: string
  createdAt: string
  lastUsed: string
  coreMemory: AgentCoreMemory
}

export const agents: Agent[] = [
  {
    id: '1',
    name: '数据分析助手',
    description: '基于工作流的数据分析智能体，支持数据清洗、统计分析和可视化报告生成',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Data',
    status: 'active',
    workflowId: 'flow-1',
    workflowName: '数据分析流程',
    knowledgeBaseId: 'kb-1',
    knowledgeBaseName: '业务知识库',
    modelName: 'Qwen-7B',
    createdAt: '2026-06-01',
    lastUsed: '2026-06-21',
    coreMemory: {
      name: '数据分析助手',
      description: '专业的数据分析师，擅长处理和分析各种业务数据',
      role: '数据分析专家',
      instructions: '你是一个专业的数据分析助手，能够帮助用户进行数据清洗、统计分析和生成可视化报告。请使用中文进行交流。',
      personality: '严谨、专业、耐心',
      constraints: ['只分析提供的数据', '不编造数据', '保持客观中立'],
    },
  },
  {
    id: '2',
    name: '文案创作专家',
    description: '智能文案生成助手，支持多种风格的文案创作和优化',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Writer',
    status: 'active',
    workflowId: 'flow-2',
    workflowName: '文案创作流程',
    knowledgeBaseId: 'kb-2',
    knowledgeBaseName: '营销知识库',
    modelName: 'Qwen-14B',
    createdAt: '2026-06-05',
    lastUsed: '2026-06-20',
    coreMemory: {
      name: '文案创作专家',
      description: '资深文案策划师，擅长撰写各种类型的营销文案',
      role: '文案策划专家',
      instructions: '你是一个专业的文案创作专家，能够撰写高质量的营销文案、产品描述、广告文案等。请使用中文进行交流。',
      personality: '创意丰富、语言优美、善于表达',
      constraints: ['保持原创性', '遵守广告法规', '不使用敏感内容'],
    },
  },
  {
    id: '3',
    name: '代码助手',
    description: '帮助编写和优化代码的智能编程助手',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coder',
    status: 'training',
    workflowId: 'flow-3',
    workflowName: '代码审查流程',
    modelName: 'CodeLlama-7B',
    createdAt: '2026-06-10',
    lastUsed: '2026-06-18',
    coreMemory: {
      name: '代码助手',
      description: '专业的软件工程师，精通多种编程语言和技术栈',
      role: '编程助手',
      instructions: '你是一个专业的编程助手，能够帮助用户编写、调试和优化代码。请使用中文进行交流。',
      personality: '逻辑清晰、耐心细致、乐于分享',
      constraints: ['保证代码质量', '遵循编码规范', '不编写恶意代码'],
    },
  },
  {
    id: '4',
    name: '知识问答机器人',
    description: '基于知识库的问答系统，支持自然语言查询',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QA',
    status: 'active',
    knowledgeBaseId: 'kb-3',
    knowledgeBaseName: '产品知识库',
    modelName: 'Qwen-7B',
    createdAt: '2026-06-15',
    lastUsed: '2026-06-21',
    coreMemory: {
      name: '知识问答机器人',
      description: '知识库问答专家，能够快速检索和回答用户问题',
      role: '知识库问答专家',
      instructions: '你是一个专业的知识库问答机器人，能够根据知识库内容准确回答用户的问题。请使用中文进行交流。',
      personality: '知识渊博、反应迅速、乐于助人',
      constraints: ['只回答知识库中的内容', '对于不确定的问题要说明', '保持回答准确'],
    },
  },
  {
    id: '5',
    name: '图像生成助手',
    description: '基于 ComfyUI 的图像生成智能体',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Artist',
    status: 'inactive',
    workflowId: 'flow-4',
    workflowName: '图像生成流程',
    modelName: 'SDXL',
    createdAt: '2026-06-18',
    lastUsed: '2026-06-19',
    coreMemory: {
      name: '图像生成助手',
      description: 'AI 绘画专家，擅长生成高质量的数字艺术作品',
      role: 'AI 艺术家',
      instructions: '你是一个专业的图像生成助手，能够根据用户的描述生成高质量的图像。请使用中文进行交流。',
      personality: '富有创意、审美独特、乐于尝试',
      constraints: ['不生成违法内容', '不生成侵犯版权的内容', '尊重用户隐私'],
    },
  },
]