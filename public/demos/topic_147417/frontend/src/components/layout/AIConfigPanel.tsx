import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAIConfigStore } from "@/stores/useAIConfigStore"
import { providerPresets } from "@/config/aiModels"
import type { AIProvider } from "@/config/aiModels"
import { Bot, HelpCircle, Save, RefreshCw, CheckCircle2, AlertCircle, TestTube } from "lucide-react"
import { useState, useEffect } from "react"
import { generateRuleByAI } from "@/engine/aiService"

const providerNames: Record<AIProvider, string> = {
  aliyun: "阿里云",
  deepseek: "DeepSeek",
  openai: "OpenAI",
  custom: "自定义",
}

const providerHelpUrls: Record<AIProvider, string> = {
  aliyun: "https://dashscope.console.aliyuncs.com/",
  deepseek: "https://platform.deepseek.com/",
  openai: "https://platform.openai.com/",
  custom: "",
}

export function AIConfigPanel() {
  const {
    provider,
    model,
    apiKey,
    baseUrl,
    enabled,
    setProvider,
    setModel,
    setApiKey,
    setBaseUrl,
    setEnabled,
    resetConfig,
  } = useAIConfigStore()

  const [localProvider, setLocalProvider] = useState<AIProvider | "">(provider)
  const [localModel, setLocalModel] = useState(model)
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")

  useEffect(() => {
    setLocalProvider(provider)
    setLocalModel(model)
    setLocalApiKey(apiKey)
    setLocalBaseUrl(baseUrl)
  }, [provider, model, apiKey, baseUrl])

  useEffect(() => {
    if (localProvider) {
      const preset = providerPresets[localProvider]
      if (!localModel && preset.defaultModel) {
        setLocalModel(preset.defaultModel)
      }
      if (!localBaseUrl && preset.defaultBaseUrl) {
        setLocalBaseUrl(preset.defaultBaseUrl)
      }
    }
  }, [localProvider])

  const availableModels = localProvider && localProvider !== "custom"
    ? providerPresets[localProvider].models
    : []

  const isCustomProvider = localProvider === "custom"

  const handleSave = () => {
    setProvider(localProvider)
    setModel(localModel)
    setApiKey(localApiKey)
    setBaseUrl(localBaseUrl)
    setEnabled(!!(localProvider && localApiKey && localModel))
    setTestStatus("idle")
    setTestMessage("")
  }

  const handleReset = () => {
    resetConfig()
    setLocalProvider("")
    setLocalModel("")
    setLocalApiKey("")
    setLocalBaseUrl("")
    setTestStatus("idle")
    setTestMessage("")
  }

  const handleTestConnection = async () => {
    if (!localProvider || !localApiKey || !localModel || !localBaseUrl) {
      setTestStatus("error")
      setTestMessage("请先填写完整配置")
      return
    }

    setTestStatus("testing")
    setTestMessage("测试中...")

    try {
      const result = await generateRuleByAI("测试", {
        provider: localProvider,
        apiKey: localApiKey,
        model: localModel,
        baseUrl: localBaseUrl,
      })

      if (result) {
        setTestStatus("success")
        setTestMessage("连接成功！")
      } else {
        setTestStatus("error")
        setTestMessage("模型返回为空")
      }
    } catch (error) {
      setTestStatus("error")
      setTestMessage(error instanceof Error ? error.message : "连接失败")
    }
  }

  const handleModelSelect = (value: string) => {
    setLocalModel(value)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="mr-1 h-4 w-4" />
          AI 设置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI 模型配置
          </DialogTitle>
          <DialogDescription>
            配置 AI 服务提供商以启用智能场景生成，未配置时使用内置模板引擎
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">服务商</label>
            <Select value={localProvider} onValueChange={(v) => setLocalProvider(v as AIProvider | "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择服务商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">不启用 AI</SelectItem>
                {Object.entries(providerNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {localProvider && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">模型名称</label>
              {availableModels.length > 0 ? (
                <div className="space-y-2">
                  <Select value={localModel} onValueChange={handleModelSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择或输入模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={localModel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalModel(e.target.value)}
                    placeholder="或输入自定义模型名称"
                    className="h-9 text-sm"
                  />
                </div>
              ) : (
                <Input
                  value={localModel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalModel(e.target.value)}
                  placeholder="输入模型名称"
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}

          {localProvider && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">API Key</label>
              <Input
                type="password"
                value={localApiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalApiKey(e.target.value)}
                placeholder="输入您的 API Key"
                className="h-9 text-sm"
              />
            </div>
          )}

          {localProvider && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Base URL</label>
              {isCustomProvider ? (
                <Input
                value={localBaseUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="h-9 text-sm"
              />
              ) : (
                <Input
                  value={localBaseUrl}
                  readOnly
                  className="h-9 text-sm bg-muted cursor-not-allowed"
                />
              )}
              {!isCustomProvider && (
                <p className="text-xs text-muted-foreground mt-1">
                  预设服务商使用固定端点，如需自定义请选择「自定义」服务商
                </p>
              )}
            </div>
          )}

          {localProvider && localProvider !== "custom" && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  如何获取免费 API Key？
                  <a
                    href={providerHelpUrls[localProvider]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    前往 {providerNames[localProvider]} 控制台
                  </a>
                </p>
              </div>
            </div>
          )}

          {testStatus !== "idle" && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              testStatus === "success" ? "bg-green-500/10 border border-green-500/30" :
              testStatus === "error" ? "bg-red-500/10 border border-red-500/30" :
              "bg-blue-500/10 border border-blue-500/30"
            }`}>
              {testStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {testStatus === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
              {testStatus === "testing" && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
              <span className={`text-sm ${
                testStatus === "success" ? "text-green-600" :
                testStatus === "error" ? "text-red-600" : "text-blue-600"
              }`}>
                {testMessage}
              </span>
            </div>
          )}

          {enabled && testStatus === "idle" && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-600">AI 服务已启用</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="mr-1 h-4 w-4" />
            重置
          </Button>
          {localProvider && localApiKey && (
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testStatus === "testing"}>
              <TestTube className="mr-1 h-4 w-4" />
              {testStatus === "testing" ? "测试中..." : "测试 AI 连接"}
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}