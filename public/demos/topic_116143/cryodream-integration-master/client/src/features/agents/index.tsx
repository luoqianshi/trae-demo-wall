import { useState, useEffect } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Play,
  Workflow,
  Database,
  Bot,
  Search,
  User,
  Lightbulb,
  AlertCircle,
  Save,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useTranslation } from 'react-i18next'
import { agentApi, type Agent, type AgentCoreMemory } from './api/agent-api'
import { knowledgeBaseApi, type KnowledgeBase } from '@/features/knowledge/api/knowledge-api'
import { listEnabledModelConfigs, type ModelConfig } from '@/features/model-config/model-config-store'
import { listProjects, listWorkflows, type FlowProject, type WorkflowSummary } from '@/features/projects/project-api'

const route = getRouteApi('/_authenticated/agents/')

type AgentStatus = 'all' | 'active' | 'inactive' | 'training'



export function Agents() {
  const { t } = useTranslation()
  const { filter = '' } = route.useSearch()
  const navigate = route.useNavigate()

  const [searchTerm, setSearchTerm] = useState(filter)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentStatus, _setAgentStatus] = useState<AgentStatus>('all')
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([])
  const [_projects, setProjects] = useState<FlowProject[]>([])
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [selectedKBIds, setSelectedKBIds] = useState<string[]>([])
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)
  const [isEditingMemory, setIsEditingMemory] = useState(false)
  const [editingMemory, setEditingMemory] = useState<AgentCoreMemory | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('memory')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedAgent) {
      setSelectedKBIds(selectedAgent.knowledgeBaseIds || [])
      setSelectedWorkflowIds(selectedAgent.workflowIds || [])
      setSelectedModelId(selectedAgent.modelConfigId || undefined)
      setEditingMemory(null)
      setIsEditingMemory(false)
    }
  }, [selectedAgent])

  const loadData = async () => {
    setLoading(true)
    try {
      const [agentsData, kbs, models, projectsData] = await Promise.all([
        agentApi.list(),
        knowledgeBaseApi.list({}),
        listEnabledModelConfigs(),
        listProjects(),
      ])
      
      setAgents(agentsData.length > 0 ? agentsData : getDefaultAgents())
      setKnowledgeBases(kbs.list)
      setModelConfigs(models)
      setProjects(projectsData.records)
      
      // 加载第一个项目的工作流列表
      if (projectsData.records.length > 0) {
        const workflowsData = await listWorkflows(projectsData.records[0].id)
        setWorkflows(workflowsData.records)
      }
      
      if (agentsData.length > 0) {
        setSelectedAgent(agentsData[0])
      } else {
        const defaultAgents = getDefaultAgents()
        setSelectedAgent(defaultAgents[0] || null)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setAgents(getDefaultAgents())
      setSelectedAgent(getDefaultAgents()[0] || null)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultAgents = (): Agent[] => [
    {
      id: '1',
      name: '数据分析助手',
      description: '基于工作流的数据分析智能体，支持数据清洗、统计分析和可视化报告生成',
      avatar: '',
      status: 'active',
      workflowIds: ['flow-1'],
      workflowNames: ['数据分析流程'],
      knowledgeBaseIds: [],
      knowledgeBaseNames: [],
      modelConfigId: undefined,
      modelConfigName: '默认 OpenAI 小模型',
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
      avatar: '',
      status: 'active',
      workflowIds: ['flow-2'],
      workflowNames: ['文案创作流程'],
      knowledgeBaseIds: [],
      knowledgeBaseNames: [],
      modelConfigId: undefined,
      modelConfigName: '默认 Claude Sonnet',
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
      name: '知识问答机器人',
      description: '基于知识库的问答系统，支持自然语言查询',
      avatar: '',
      status: 'active',
      workflowIds: [],
      workflowNames: [],
      knowledgeBaseIds: [],
      knowledgeBaseNames: ['业务知识库'],
      modelConfigId: undefined,
      modelConfigName: '本地 Ollama',
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
      id: '4',
      name: 'z-image 文生图提示词大师',
      description: '专业的AI绘画提示词生成助手，帮助你创作出高质量的文生图提示词',
      avatar: '',
      status: 'active',
      workflowIds: [],
      workflowNames: [],
      knowledgeBaseIds: [],
      knowledgeBaseNames: [],
      modelConfigId: undefined,
      modelConfigName: '默认 OpenAI 小模型',
      coreMemory: {
        name: 'z-image 文生图提示词大师',
        description: '专业的AI绘画提示词专家，精通各种绘画风格和技巧描述',
        role: '文生图提示词专家',
        instructions: '你是一个专业的AI绘画提示词大师，擅长帮助用户创作高质量的文生图提示词。请使用中文进行交流。\n\n你的任务是根据用户的描述，生成详细、专业的AI绘画提示词，包括：\n1. 主体描述\n2. 风格和艺术流派\n3. 光线和氛围\n4. 构图和视角\n5. 色彩和质感\n6. 细节和特效',
        personality: '创意无限、专业细致、善于表达',
        constraints: ['生成的提示词要具体详细', '使用专业的艺术术语', '保持提示词的多样性', '避免使用模糊描述'],
      },
    },
  ]

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = agentStatus === 'all' || agent.status === agentStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Agent['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      training: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    }
    const labels = {
      active: t('common.active'),
      inactive: t('common.inactive'),
      training: '训练中',
    }
    return (
      <Badge variant='outline' className={styles[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    navigate({
      search: (prev) => ({
        ...prev,
        filter: e.target.value || undefined,
      }),
    })
  }

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent)
  }

  const handleKBChange = async (value: string) => {
    if (value === '__none__') {
      setSelectedKBIds([])
      if (selectedAgent) {
        try {
          await agentApi.update({
            id: selectedAgent.id,
            knowledgeBaseIds: [],
          })
          const updatedAgent = { ...selectedAgent, knowledgeBaseIds: [], knowledgeBaseNames: [] }
          setSelectedAgent(updatedAgent)
          setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
          toast.success('知识库配置已更新')
        } catch (error) {
          console.error('Failed to update agent knowledge base:', error)
          toast.error('知识库配置更新失败')
        }
      }
      return
    }
    
    const newKBIds = selectedKBIds.includes(value)
      ? selectedKBIds.filter(id => id !== value)
      : [...selectedKBIds, value]
    
    setSelectedKBIds(newKBIds)
    if (selectedAgent) {
      try {
        await agentApi.update({
          id: selectedAgent.id,
          knowledgeBaseIds: newKBIds,
        })
        const updatedAgent = { 
          ...selectedAgent, 
          knowledgeBaseIds: newKBIds, 
          knowledgeBaseNames: newKBIds.map(id => knowledgeBases.find(kb => kb.id === id)?.name || id)
        }
        setSelectedAgent(updatedAgent)
        setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
        toast.success('知识库配置已更新')
      } catch (error) {
        console.error('Failed to update agent knowledge base:', error)
        toast.error('知识库配置更新失败')
      }
    }
  }

  const handleWorkflowChange = async (value: string) => {
    if (value === '__none__') {
      setSelectedWorkflowIds([])
      if (selectedAgent) {
        try {
          await agentApi.update({
            id: selectedAgent.id,
            workflowIds: [],
          })
          const updatedAgent = { ...selectedAgent, workflowIds: [], workflowNames: [] }
          setSelectedAgent(updatedAgent)
          setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
          toast.success('工作流配置已更新')
        } catch (error) {
          console.error('Failed to update agent workflow:', error)
          toast.error('工作流配置更新失败')
        }
      }
      return
    }
    
    const newWorkflowIds = selectedWorkflowIds.includes(value)
      ? selectedWorkflowIds.filter(id => id !== value)
      : [...selectedWorkflowIds, value]
    
    setSelectedWorkflowIds(newWorkflowIds)
    if (selectedAgent) {
      try {
        await agentApi.update({
          id: selectedAgent.id,
          workflowIds: newWorkflowIds,
        })
        const updatedAgent = { 
          ...selectedAgent, 
          workflowIds: newWorkflowIds, 
          workflowNames: newWorkflowIds.map(id => workflows.find(w => w.id === id)?.name || id)
        }
        setSelectedAgent(updatedAgent)
        setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
        toast.success('工作流配置已更新')
      } catch (error) {
        console.error('Failed to update agent workflow:', error)
        toast.error('工作流配置更新失败')
      }
    }
  }

  const handleModelChange = async (value: string) => {
    const newModelId = value === '__none__' ? undefined : value
    setSelectedModelId(newModelId)
    if (selectedAgent) {
      try {
        await agentApi.update({
          id: selectedAgent.id,
          modelConfigId: newModelId,
        })
        const updatedAgent = { ...selectedAgent, modelConfigId: newModelId, modelConfigName: modelConfigs.find(m => m.id === newModelId)?.name }
        setSelectedAgent(updatedAgent)
        setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
        toast.success('模型配置已更新')
      } catch (error) {
        console.error('Failed to update agent model:', error)
        toast.error('模型配置更新失败')
      }
    }
  }

  const handleStartEditMemory = () => {
    if (selectedAgent?.coreMemory) {
      setEditingMemory({ ...selectedAgent.coreMemory })
      setIsEditingMemory(true)
    }
  }

  const handleSaveMemory = async () => {
    if (editingMemory && selectedAgent) {
      try {
        await agentApi.update({
          id: selectedAgent.id,
          coreMemory: editingMemory,
        })
        const updatedAgent = { ...selectedAgent, coreMemory: editingMemory }
        setSelectedAgent(updatedAgent)
        setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a))
        toast.success('核心记忆已更新')
      } catch (error) {
        console.error('Failed to update agent:', error)
        toast.error('核心记忆更新失败')
      }
      setIsEditingMemory(false)
      setEditingMemory(null)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingMemory(false)
    setEditingMemory(null)
  }

  const handleRunAgent = () => {
    if (selectedAgent?.workflowIds && selectedAgent.workflowIds.length > 0) {
      const firstWorkflowId = selectedAgent.workflowIds[0]
      const workflow = workflows.find(w => w.id === firstWorkflowId)
      if (workflow) {
        navigate({ to: `/flow?projectId=${workflow.projectId}&workflowId=${workflow.id}` })
      } else {
        navigate({ to: `/flow?workflowId=${firstWorkflowId}` })
      }
    } else {
      alert('请先为智能体配置工作流')
    }
  }

  if (loading) {
    return (
      <>
        <Header>
          <Search />
        </Header>
        <Main fixed className='flex items-center justify-center'>
          <div className='text-center'>
            <Bot className='size-16 text-muted-foreground mx-auto mb-4 animate-pulse' />
            <p className='text-muted-foreground'>加载中...</p>
          </div>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
      </Header>

      <Main fixed className='p-0'>
        <div className='h-full flex flex-col lg:flex-row'>
          <div className={`${sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'} border-r lg:border-l-0 border-r-0 lg:border-l lg:border-r flex flex-col transition-all duration-300`}>
            <div className='p-3 flex-1 overflow-hidden'>
              {!sidebarCollapsed && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <Bot className='size-5 text-primary' />
                      <span className='font-bold text-sm'>{t('common.agents')}</span>
                    </div>
                    <Button variant='ghost' size='icon' onClick={() => setSidebarCollapsed(true)} className='h-7 w-7'>
                      <PanelLeftClose size={16} />
                    </Button>
                  </div>

                  <div className='relative'>
                    <Search className='absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground' />
                    <Input
                      placeholder='搜索...'
                      className='pl-7 text-xs h-8'
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>

                  <Separator className='my-2' />

                  <div className='space-y-2 max-h-[calc(100vh-180px)] overflow-auto'>
                    {filteredAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className={`cursor-pointer transition-all ${
                          selectedAgent?.id === agent.id
                            ? 'border-primary shadow-sm'
                            : 'hover:border-muted-300'
                        }`}
                        onClick={() => handleSelectAgent(agent)}
                      >
                        <CardContent className='p-2'>
                          <div className='flex items-center gap-2'>
                            <Avatar className='size-8'>
                              <AvatarFallback className='bg-primary/10 text-primary text-xs'>
                                <Bot size={14} />
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-1.5'>
                                <h3 className='font-medium text-sm truncate'>{agent.name}</h3>
                                {getStatusBadge(agent.status)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {sidebarCollapsed && (
                <div className='flex flex-col items-center'>
                  <Button variant='ghost' size='icon' onClick={() => setSidebarCollapsed(false)} className='h-8 w-8 mb-3'>
                    <PanelLeftOpen size={18} />
                  </Button>
                  <div className='space-y-2 flex-1 overflow-auto w-full px-1'>
                    {filteredAgents.map((agent) => (
                      <Card
                        key={agent.id}
                        className={`cursor-pointer transition-all ${
                          selectedAgent?.id === agent.id
                            ? 'border-primary shadow-sm'
                            : 'hover:border-muted-300'
                        }`}
                        onClick={() => handleSelectAgent(agent)}
                      >
                        <CardContent className='p-2 flex justify-center'>
                          <Avatar className='size-8'>
                            <AvatarFallback className={`${selectedAgent?.id === agent.id ? 'bg-primary text-primary/10' : 'bg-primary/10 text-primary'} text-xs`}>
                              <Bot size={14} />
                            </AvatarFallback>
                          </Avatar>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='flex-1 overflow-auto'>
            {selectedAgent ? (
              <div className='p-4 lg:p-6 space-y-4'>
                <Card>
                  <CardHeader className='flex flex-row items-start justify-between pb-2'>
                    <div className='flex items-center gap-4'>
                      <Avatar className='size-14'>
                        <AvatarFallback className='bg-primary/10 text-primary text-xl'>
                          <Bot size={24} />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='flex items-center gap-2'>
                          <CardTitle className='text-xl'>{selectedAgent.name}</CardTitle>
                          {getStatusBadge(selectedAgent.status)}
                        </div>
                        <CardDescription className='mt-1'>{selectedAgent.description}</CardDescription>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm' onClick={handleStartEditMemory}>
                        <Edit3 size={16} className='mr-2' />
                        编辑记忆
                      </Button>
                      <Button size='sm' onClick={handleRunAgent} disabled={selectedAgent.status !== 'active'}>
                        <Play size={16} className='mr-2' />
                        启动对话
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                  <TabsList className='grid w-full grid-cols-4'>
                    <TabsTrigger value='memory'>
                      <User size={14} className='mr-1' />
                      核心记忆
                    </TabsTrigger>
                    <TabsTrigger value='model'>
                      <Bot size={14} className='mr-1' />
                      模型
                    </TabsTrigger>
                    <TabsTrigger value='workflow'>
                      <Workflow size={14} className='mr-1' />
                      工作流
                    </TabsTrigger>
                    <TabsTrigger value='knowledge'>
                      <Database size={14} className='mr-1' />
                      知识库
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='memory' className='mt-4'>
                    <Card>
                      <CardHeader className='flex flex-row items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <User className='size-5 text-primary' />
                          <CardTitle>核心记忆</CardTitle>
                        </div>
                        {isEditingMemory && (
                          <div className='flex gap-2'>
                            <Button variant='outline' size='sm' onClick={handleCancelEdit}>
                              取消
                            </Button>
                            <Button size='sm' onClick={handleSaveMemory}>
                              <Save size={16} className='mr-2' />
                              保存
                            </Button>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        {selectedAgent.coreMemory ? (
                          <>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <label className='text-sm font-medium text-muted-foreground mb-2 block'>
                                  名称
                                </label>
                                {isEditingMemory ? (
                                  <Input
                                    value={editingMemory?.name || ''}
                                    onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, name: e.target.value })}
                                  />
                                ) : (
                                  <div className='rounded-lg bg-muted/50 p-3'>
                                    {selectedAgent.coreMemory.name}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className='text-sm font-medium text-muted-foreground mb-2 block'>
                                  角色
                                </label>
                                {isEditingMemory ? (
                                  <Input
                                    value={editingMemory?.role || ''}
                                    onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, role: e.target.value })}
                                  />
                                ) : (
                                  <div className='rounded-lg bg-muted/50 p-3'>
                                    {selectedAgent.coreMemory.role}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className='text-sm font-medium text-muted-foreground mb-2 block'>
                                描述
                              </label>
                              {isEditingMemory ? (
                                <textarea
                                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none'
                                  value={editingMemory?.description || ''}
                                  onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, description: e.target.value })}
                                />
                              ) : (
                                <div className='rounded-lg bg-muted/50 p-3'>
                                  {selectedAgent.coreMemory.description}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className='text-sm font-medium text-muted-foreground mb-2 block'>
                                指令
                              </label>
                              {isEditingMemory ? (
                                <textarea
                                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[100px] resize-none'
                                  value={editingMemory?.instructions || ''}
                                  onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, instructions: e.target.value })}
                                />
                              ) : (
                                <div className='rounded-lg bg-muted/50 p-3'>
                                  {selectedAgent.coreMemory.instructions}
                                </div>
                              )}
                            </div>

                            {selectedAgent.coreMemory.personality && (
                              <div>
                                <label className='text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2'>
                                  <Lightbulb size={14} />
                                  性格特点
                                </label>
                                {isEditingMemory ? (
                                  <Input
                                    value={editingMemory?.personality || ''}
                                    onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, personality: e.target.value })}
                                  />
                                ) : (
                                  <div className='rounded-lg bg-muted/50 p-3'>
                                    {selectedAgent.coreMemory.personality}
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedAgent.coreMemory.constraints && selectedAgent.coreMemory.constraints.length > 0 && (
                              <div>
                                <label className='text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2'>
                                  <AlertCircle size={14} />
                                  约束条件
                                </label>
                                {isEditingMemory ? (
                                  <textarea
                                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none'
                                    value={editingMemory?.constraints?.join('\n') || ''}
                                    onChange={(e) => editingMemory && setEditingMemory({ ...editingMemory, constraints: e.target.value.split('\n').filter(Boolean) })}
                                  />
                                ) : (
                                  <ul className='space-y-2'>
                                    {selectedAgent.coreMemory.constraints.map((constraint, index) => (
                                      <li key={index} className='flex items-start gap-2 text-sm'>
                                        <span className='text-primary mt-1'>-</span>
                                        <span>{constraint}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className='text-center py-8 text-muted-foreground'>
                            <p>该智能体尚未配置核心记忆</p>
                            <Button variant='outline' size='sm' className='mt-3' onClick={handleStartEditMemory}>
                              添加核心记忆
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='model' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <div className='flex items-center gap-2'>
                          <Bot className='size-5 text-primary' />
                          <CardTitle>模型配置</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <Select value={selectedModelId ?? '__none__'} onValueChange={handleModelChange}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='选择模型' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='__none__'>无</SelectItem>
                            {modelConfigs.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}（{model.providerName} / {model.model}）
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className='text-sm text-muted-foreground'>
                          为智能体选择一个语言模型
                        </p>
                        <div className='rounded-lg bg-muted/50 p-3'>
                          <div className='text-sm text-muted-foreground'>当前选择：</div>
                          <div className='font-medium mt-1'>
                            {selectedAgent.modelConfigName || '未配置'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='workflow' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <div className='flex items-center gap-2'>
                          <Workflow className='size-5 text-primary' />
                          <CardTitle>工作流配置</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <Select value={selectedWorkflowIds.length > 0 ? '' : '__none__'} onValueChange={handleWorkflowChange}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder={selectedWorkflowIds.length > 0 ? `${selectedWorkflowIds.length} 个已选择` : '选择工作流（支持多选）'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>已选择 ({selectedWorkflowIds.length})</SelectLabel>
                              {selectedWorkflowIds.length > 0 ? (
                                selectedWorkflowIds.map((id) => {
                                  const workflow = workflows.find(w => w.id === id)
                                  return (
                                    <SelectItem key={id} value={id} className='bg-primary/10'>
                                      ✓ {workflow?.name || id}
                                    </SelectItem>
                                  )
                                })
                              ) : (
                                <div className='px-2 py-1 text-sm text-muted-foreground'>暂无选择</div>
                              )}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>全部工作流</SelectLabel>
                              {workflows.length > 0 ? (
                                workflows.filter(w => !selectedWorkflowIds.includes(w.id)).map((workflow) => (
                                  <SelectItem key={workflow.id} value={workflow.id}>
                                    {workflow.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className='px-2 py-1 text-sm text-muted-foreground'>暂无可用工作流</div>
                              )}
                            </SelectGroup>
                            <SelectItem value='__none__' className='border-t mt-2'>
                              清除全部选择
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className='text-sm text-muted-foreground'>
                          为智能体选择工作流（可多选），启动时将执行选中的工作流
                        </p>
                        <div className='rounded-lg bg-muted/50 p-3'>
                          <div className='text-sm text-muted-foreground'>当前选择：</div>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            {selectedAgent.workflowNames && selectedAgent.workflowNames.length > 0 ? (
                              selectedAgent.workflowNames.map((name, index) => (
                                <Badge key={index} variant='secondary'>{name}</Badge>
                              ))
                            ) : (
                              <span className='text-muted-foreground'>未配置</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value='knowledge' className='mt-4'>
                    <Card>
                      <CardHeader>
                        <div className='flex items-center gap-2'>
                          <Database className='size-5 text-primary' />
                          <CardTitle>知识库配置</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <Select value={selectedKBIds.length > 0 ? '' : '__none__'} onValueChange={handleKBChange}>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder={selectedKBIds.length > 0 ? `${selectedKBIds.length} 个已选择` : '选择知识库（支持多选）'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>已选择 ({selectedKBIds.length})</SelectLabel>
                              {selectedKBIds.length > 0 ? (
                                selectedKBIds.map((id) => {
                                  const kb = knowledgeBases.find(k => k.id === id)
                                  return (
                                    <SelectItem key={id} value={id} className='bg-primary/10'>
                                      ✓ {kb?.name || id}
                                    </SelectItem>
                                  )
                                })
                              ) : (
                                <div className='px-2 py-1 text-sm text-muted-foreground'>暂无选择</div>
                              )}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>全部知识库</SelectLabel>
                              {knowledgeBases.length > 0 ? (
                                knowledgeBases.filter(k => !selectedKBIds.includes(k.id)).map((kb) => (
                                  <SelectItem key={kb.id} value={kb.id}>
                                    {kb.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className='px-2 py-1 text-sm text-muted-foreground'>暂无可用知识库</div>
                              )}
                            </SelectGroup>
                            <SelectItem value='__none__' className='border-t mt-2'>
                              清除全部选择
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className='text-sm text-muted-foreground'>
                          为智能体关联知识库（可多选），支持检索知识库内容进行回答
                        </p>
                        <div className='rounded-lg bg-muted/50 p-3'>
                          <div className='text-sm text-muted-foreground'>当前选择：</div>
                          <div className='flex flex-wrap gap-2 mt-2'>
                            {selectedAgent.knowledgeBaseNames && selectedAgent.knowledgeBaseNames.length > 0 ? (
                              selectedAgent.knowledgeBaseNames.map((name, index) => (
                                <Badge key={index} variant='secondary'>{name}</Badge>
                              ))
                            ) : (
                              <span className='text-muted-foreground'>未配置</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className='h-full flex items-center justify-center'>
                <div className='text-center'>
                  <Bot className='size-16 text-muted-foreground mx-auto mb-4' />
                  <p className='text-muted-foreground'>选择一个智能体查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  )
}