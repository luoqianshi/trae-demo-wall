import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/stores/useAppStore"
import { useSmartHomeAI } from "@/hooks/useSmartHomeAI"
import { Send, Sparkles, Zap, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function NaturalPanel() {
  const {
    naturalLanguageInput,
    naturalLanguageMode,
    setNaturalLanguageInput,
    setNaturalLanguageMode,
    setGeneratedRule,
    setGenerationError,
    clearRule,
    generateFromNaturalLanguage,
  } = useAppStore()

  const { isAILoading, aiError, aiErrorType, aiDuration, generateRule } = useSmartHomeAI()

  const handleGenerate = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.warning("请输入您的需求")
      return
    }

    setGenerationError(null)

    if (naturalLanguageMode === "basic") {
      const success = generateFromNaturalLanguage()
      if (!success) {
        toast.error("没有匹配到合适的场景模板，请换个说法试试")
      } else {
        toast.success("场景已生成")
      }
      return
    }

    try {
      const rule = await generateRule(naturalLanguageInput.trim())

      if (rule) {
        setGeneratedRule(rule)
        toast.success("场景已生成")
      } else {
        setGenerationError("没有匹配到合适的场景模板，请换个说法试试")
        toast.error("没有匹配到合适的场景模板")
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成规则失败")
      toast.error("生成规则失败")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleGenerate()
    }
  }

  const isAdvancedMode = naturalLanguageMode === "advanced"
  const isButtonDisabled = isAdvancedMode
    ? isAILoading || !naturalLanguageInput.trim()
    : !naturalLanguageInput.trim()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">自然语言生成</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">基础模式</span>
          <Switch
            checked={isAdvancedMode}
            onCheckedChange={(v) => setNaturalLanguageMode(v ? "advanced" : "basic")}
          />
          <span className="text-xs text-muted-foreground">高级模式</span>
        </div>
      </div>

      <textarea
        value={naturalLanguageInput}
        onChange={(e) => setNaturalLanguageInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isAdvancedMode ? "试试说：有人经过时打开客厅灯" : "试试说：晚上10点有人经过玄关就开灯"}
        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        rows={4}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ctrl + Enter 快速生成</span>
          {isAdvancedMode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              <Zap className="h-3 w-3" />
              AI 增强
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearRule}>
            清除
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isButtonDisabled}
          >
            {isAILoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                AI 正在生成规则...
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                生成场景规则
              </>
            )}
          </Button>
        </div>
      </div>

      {aiError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              {aiErrorType === "device_filtered" ? "设备未接入" : "AI 生成失败，已回退到模板引擎"}
            </p>
            <p className="text-xs opacity-75 mt-1">{aiError}</p>
          </div>
        </div>
      )}

      {!isAILoading && aiDuration !== null && isAdvancedMode && (
        <div className="rounded-md bg-primary/10 p-2 text-xs text-primary flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          AI 生成，耗时 {aiDuration.toFixed(1)} 秒
        </div>
      )}
    </div>
  )
}