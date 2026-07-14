import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatePanel } from "@/components/template/TemplatePanel"
import { NaturalPanel } from "@/components/input/NaturalPanel"
import { DeviceListPanel } from "@/components/device/DeviceListPanel"
import { PlatformConnector } from "@/components/layout/PlatformConnector"
import { AIConfigPanel } from "@/components/layout/AIConfigPanel"
import { RuleCard } from "@/components/output/RuleCard"
import { RuleFlowCanvas } from "@/components/flow/RuleFlowCanvas"
import { useAppStore } from "@/stores/useAppStore"
import { usePlatformConfigStore } from "@/stores/usePlatformConfigStore"
import { Home, Plus, ChevronDown, ChevronUp, Eye, Trash2, Monitor } from "lucide-react"
import { useState, useEffect } from "react"
import { Toaster } from "sonner"

function App() {
  const { generatedRule, mode, setMode, savedRules, loadRule, deleteRule, connectTuyaPlatform, platformStatus } = useAppStore()
  const { tuyaClientId, tuyaSecret } = usePlatformConfigStore()
  const [isSavedRulesExpanded, setIsSavedRulesExpanded] = useState(false)
  const [isRulePanelExpanded, setIsRulePanelExpanded] = useState(true)

  useEffect(() => {
    if (platformStatus === "disconnected" && tuyaClientId && tuyaSecret) {
      connectTuyaPlatform()
    }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">🏠 智能家居场景助手</h1>
            <p className="text-xs text-muted-foreground">零后端 · 跨平台联动 · 隐私优先</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AIConfigPanel />
          <PlatformConnector />
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            新建场景
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[420px] flex flex-col border-r bg-background h-full">
          <div className="overflow-y-auto p-4" style={{ flex: '3' }}>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "template" | "natural" | "devices")} className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="template" className="flex-1">
                  快速模板
                </TabsTrigger>
                <TabsTrigger value="natural" className="flex-1">
                  自然语言生成
                </TabsTrigger>
                <TabsTrigger value="devices" className="flex-1">
                  <Monitor className="mr-1.5 h-3.5 w-3.5" />
                  我的设备
                </TabsTrigger>
              </TabsList>
              <TabsContent value="template">
                <TemplatePanel />
              </TabsContent>
              <TabsContent value="natural">
                <NaturalPanel />
              </TabsContent>
              <TabsContent value="devices">
                <DeviceListPanel />
              </TabsContent>
            </Tabs>
          </div>
          {generatedRule && (
            <>
              <div
                className="border-t flex items-center justify-between px-4 py-2 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => setIsRulePanelExpanded(!isRulePanelExpanded)}
              >
                <span className="text-xs font-medium text-muted-foreground">场景规则</span>
                {isRulePanelExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className={`overflow-y-auto p-4 transition-all duration-300 ${isRulePanelExpanded ? 'flex-[7]' : 'h-0'}`}>
                <RuleCard />
              </div>
            </>
          )}

          <div className="flex-shrink-0 border-t">
            <button
              onClick={() => setIsSavedRulesExpanded(!isSavedRulesExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">已保存场景（{savedRules.length}）</span>
              {isSavedRulesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {isSavedRulesExpanded && (
              <div className="px-4 pb-4">
                {savedRules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无保存的场景</p>
                ) : (
                  <div className="space-y-2">
                    {(savedRules || []).map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(rule.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => loadRule(rule.id)}
                            className="p-1.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                            title="加载规则"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="p-1.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-red-500"
                            title="删除规则"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <main className={`flex-1 relative transition-all duration-300 ${isRulePanelExpanded ? '' : 'opacity-50'}`}>
          <RuleFlowCanvas />
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default App