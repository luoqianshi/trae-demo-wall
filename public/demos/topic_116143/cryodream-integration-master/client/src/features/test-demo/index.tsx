import { useMemo, useState } from 'react'
import { Activity, BadgeCheck, PlayCircle, SearchX, Server, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { runFlow, type RunFlowStep } from '@/features/flow/api/run-flow'
import { nodeTemplates } from '@/features/flow/config/nodeTemplates'
import type { ComponentTemplate } from '@/features/flow/types'

/** 工作流节点定义 */
interface WorkflowNodeDef {
  id: string
  type: string
  title: string
  desc: string
  x: number
  y: number
  values: Record<string, unknown>
}

/** 构建 4 节点知识入库工作流 */
const buildIngestionWorkflow = (docContent: string, kbId: string, llmConfigId: string, embeddingConfigId: string) => {
  const nodeDefs: WorkflowNodeDef[] = [
    {
      id: 'node-loader',
      type: 'DocumentLoader',
      title: '文档加载器',
      desc: '加载并解析文档内容为纯文本',
      x: 0,
      y: 0,
      values: { content: docContent, file_type: 'txt', file_path: '' },
    },
    {
      id: 'node-meta',
      type: 'GlobalMetadataExtractor',
      title: '全局元数据提取',
      desc: '使用 LLM 提取文档的主题、实体、概念等元数据',
      x: 320,
      y: 0,
      values: { model_config_id: llmConfigId },
    },
    {
      id: 'node-chunker',
      type: 'SemanticChunker',
      title: '语义分块',
      desc: '按段落逻辑切分文本为向量块',
      x: 640,
      y: 0,
      values: { chunk_size: 500, overlap_size: 50 },
    },
    {
      id: 'node-writer',
      type: 'KnowledgeBaseWriter',
      title: '知识库写入',
      desc: '将文本块向量化后写入指定知识库',
      x: 960,
      y: 0,
      values: { kb_id: kbId, embedding_model_id: embeddingConfigId },
    },
  ]

  const templateMap = new Map(nodeTemplates.map((t) => [t.type, t]))

  const nodes = nodeDefs.map((def) => {
    const tmpl = (templateMap.get(def.type) as ComponentTemplate) ?? {
      type: def.type,
      display_name: def.title,
      description: def.desc,
      icon: 'FileText',
      base_classes: ['Data'],
      category: 'files_and_knowledge',
      template: {},
      outputs: [{ name: 'text', display_name: '文本', types: ['Text'] }],
    }
    return {
      id: def.id,
      type: 'genericNode',
      position: { x: def.x, y: def.y },
      data: {
        id: def.id,
        type: def.type,
        node: tmpl,
        values: def.values,
      },
    }
  })

  const edges = [
    { id: 'edge-1-2', source: 'node-loader', target: 'node-meta', sourceHandle: 'text', targetHandle: 'input' },
    { id: 'edge-2-3', source: 'node-meta', target: 'node-chunker', sourceHandle: 'metadata', targetHandle: 'input' },
    { id: 'edge-3-4', source: 'node-chunker', target: 'node-writer', sourceHandle: 'chunks', targetHandle: 'chunks' },
  ]

  return { nodes, edges, nodeDefs }
}

export function TestDemoPage() {
  const [serverStatus, setServerStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle')
  const [docContent, setDocContent] = useState<string>(
    '大语言模型（LLM）是一种基于 Transformer 架构的 AI 模型，通过海量文本数据进行预训练。\n它擅长理解和生成自然语言，能够执行问答、翻译、摘要、代码生成等多种任务。\n向量检索（RAG）通过将文档切分为向量块，在用户提问时检索最相关的上下文，显著增强了 LLM 的事实准确性。\n常见的向量数据库包括 Milvus、PgVector、ChromaDB。',
  )
  const [kbId, setKbId] = useState<string>('kb-demo-001')
  const [llmConfigId, setLlmConfigId] = useState<string>('')
  const [embeddingConfigId, setEmbeddingConfigId] = useState<string>('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<RunFlowStep[]>([])
  const [finalResult, setFinalResult] = useState<string>('')
  const [rawRequest, setRawRequest] = useState<string>('')

  const workflow = useMemo(
    () => buildIngestionWorkflow(docContent, kbId, llmConfigId, embeddingConfigId),
    [docContent, kbId, llmConfigId, embeddingConfigId],
  )

  const checkServer = async () => {
    setServerStatus('checking')
    try {
      const res = await fetch('/api/flow/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: 'ping-flow',
          inputValue: 'ping',
          sessionId: 'ping',
          flow: { nodes: [], edges: [] },
        }),
      })
      if (res.status === 200 || res.status === 400) {
        setServerStatus('online')
      } else {
        setServerStatus('offline')
      }
    } catch {
      setServerStatus('offline')
    }
  }

  const runWorkflow = async () => {
    setRunning(true)
    setSteps([])
    setFinalResult('')

    const { nodes, edges } = workflow
    const requestBody = {
      flowId: `flow-ingestion-${Date.now()}`,
      inputValue: '',
      sessionId: `test-session-${Date.now()}`,
      flow: { nodes, edges },
    }
    setRawRequest(JSON.stringify(requestBody, null, 2))

    try {
      const result = await runFlow(requestBody)
      setSteps(result.steps ?? [])
      setFinalResult(
        result.status === 'SUCCESS'
          ? `运行成功！共 ${result.steps?.length ?? 0} 个节点执行完成。`
          : `运行失败：${result.errorMessage ?? '未知错误'}`,
      )
    } catch (error) {
      console.error('工作流执行失败：', error)
      setFinalResult(`执行失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">工作流测试器 — 知识入库流水线</h1>
        <p className="text-muted-foreground mt-1">预置 4 节点工作流：文档加载 → 元数据提取 → 语义分块 → 知识库写入</p>
      </div>

      <Separator />

      {/* 服务状态 */}
      <Card className={cn(serverStatus === 'online' && 'border-green-500/40')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            后端连接状态
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {serverStatus === 'idle' && <SearchX className="size-4 text-muted-foreground" />}
            {serverStatus === 'checking' && <Activity className="size-4 text-blue-500 animate-pulse" />}
            {serverStatus === 'online' && <BadgeCheck className="size-4 text-green-500" />}
            {serverStatus === 'offline' && <Zap className="size-4 text-red-500" />}
            <span className="text-sm">
              {serverStatus === 'idle' && '尚未检测'}
              {serverStatus === 'checking' && '检测中...'}
              {serverStatus === 'online' && '后端服务已连接（http://localhost:8111/api）'}
              {serverStatus === 'offline' && '后端服务未连接'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={checkServer}>检测连接</Button>
        </CardContent>
      </Card>

      {/* 工作流可视化 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">工作流结构</CardTitle>
          <CardDescription>以下节点将按顺序执行</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-stretch gap-2 overflow-x-auto">
            {workflow.nodeDefs.map((node, index) => (
              <div key={node.id} className="flex items-center">
                <div className="flex min-w-56 flex-col rounded-lg border bg-card p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{node.type}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{node.title}</div>
                  <div className="text-xs text-muted-foreground">{node.desc}</div>
                </div>
                {index < workflow.nodeDefs.length - 1 && (
                  <div className="px-2 text-muted-foreground">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 配置区 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">文档内容</CardTitle>
            <CardDescription>将被解析、分块并入库的文本</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              rows={8}
              placeholder="在此粘贴要入库的文档内容..."
              className="font-mono text-sm"
            />
            <div className="mt-2 text-xs text-muted-foreground">当前字符数：{docContent.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">知识库 ID</CardTitle>
            <CardDescription>写入的目标知识库</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={kbId}
              onChange={(e) => setKbId(e.target.value)}
              placeholder="kb-xxx"
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">模型配置</CardTitle>
            <CardDescription>可选：从模型设置页复制 ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">LLM 模型配置 ID（用于元数据提取）</div>
              <input
                type="text"
                value={llmConfigId}
                onChange={(e) => setLlmConfigId(e.target.value)}
                placeholder="model-config-xxx"
                className="w-full rounded-md border bg-card px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">嵌入模型配置 ID（用于向量化）</div>
              <input
                type="text"
                value={embeddingConfigId}
                onChange={(e) => setEmbeddingConfigId(e.target.value)}
                placeholder="model-config-xxx"
                className="w-full rounded-md border bg-card px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 运行按钮 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={runWorkflow}
          disabled={running || !docContent.trim()}
          className="gap-2 px-8"
        >
          <PlayCircle className="size-5" />
          {running ? '正在执行工作流...' : '运行知识入库工作流'}
        </Button>
      </div>

      {/* 运行结果 */}
      {(steps.length > 0 || finalResult) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">执行结果</CardTitle>
            <CardDescription>{finalResult}</CardDescription>
          </CardHeader>
          <CardContent>
            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={step.nodeId} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-semibold">{step.nodeName}</span>
                        <span className="font-mono text-xs text-muted-foreground">({step.nodeType})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          step.status === 'SUCCESS' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600',
                        )}>
                          {step.status}
                        </Badge>
                        {step.elapsedMs !== undefined && <span className="text-xs text-muted-foreground">耗时 {step.elapsedMs}ms</span>}
                      </div>
                    </div>
                    {step.output && Object.keys(step.output).length > 0 && (
                      <div className="mt-2 overflow-hidden">
                        <div className="text-xs text-muted-foreground mb-1">节点输出：</div>
                        <pre className="max-h-40 overflow-auto rounded bg-muted/50 p-2 text-xs">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.errorMessage && (
                      <div className="mt-2 text-xs text-red-500">错误信息：{step.errorMessage}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 请求体预览 */}
      {rawRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">请求体预览（POST /api/flow/run）</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-48 overflow-auto rounded bg-muted/50 p-3 text-xs">
              {rawRequest}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
