import { Outlet, createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Globe, FileText, Zap, Briefcase, MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/system-workflows')({
  component: SystemWorkflowsLayout,
})

const workflowTabs = [
  { value: 'standard-rag' as const, label: '普通 RAG 入库', icon: Brain },
  { value: 'tiered-rag' as const, label: '自动分级入库', icon: Brain },
  { value: 'event-ingestion' as const, label: '事件入库', icon: Zap },
  { value: 'case-ingestion' as const, label: '案例入库', icon: Briefcase },
  { value: 'opinion-ingestion' as const, label: '观点入库', icon: MessageSquare },
  { value: 'thinking-model' as const, label: '思维模型入库', icon: Brain },
  { value: 'web-parse' as const, label: '网页解析入库', icon: Globe },
  { value: 'file-parse' as const, label: '文件解析入库', icon: FileText },
]

function SystemWorkflowsLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // 从当前路径提取 active tab
  const currentPath = location.pathname
  const activeTab = workflowTabs.find((tab) => currentPath.endsWith(tab.value))?.value ?? 'case-ingestion'

  const handleTabChange = (value: string) => {
    if (value === 'standard-rag') {
      navigate({ to: '/system-workflows/standard-rag' })
    }
    if (value === 'tiered-rag') {
      navigate({ to: '/system-workflows/tiered-rag' })
    }
    if (value === 'event-ingestion') {
      navigate({ to: '/system-workflows/event-ingestion' })
    }
    if (value === 'case-ingestion') {
      navigate({ to: '/system-workflows/case-ingestion' })
    }
    if (value === 'opinion-ingestion') {
      navigate({ to: '/system-workflows/opinion-ingestion' })
    }
    if (value === 'thinking-model') {
      navigate({ to: '/system-workflows/thinking-model' })
    }
    if (value === 'web-parse') {
      navigate({ to: '/system-workflows/web-parse' })
    }
    if (value === 'file-parse') {
      navigate({ to: '/system-workflows/file-parse' })
    }
  }

  return (
    <>
      <Header fixed>
        <div className="ms-auto flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-8">
              {workflowTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 px-3 text-xs">
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Header>
      <Outlet />
    </>
  )
}
