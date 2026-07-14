import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAppStore } from "@/stores/useAppStore"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, X, Check, ChevronDown, ChevronUp } from "lucide-react"
import { getConditionDisplay } from "@/engine/displayHelper"
import { generateHAYAML } from "@/engine/haExporter"
import type { SceneRule } from "@/engine/types"

function getTriggerIcon(type: string): string {
  switch (type) {
    case "manual":
      return "✨"
    case "timer":
      return "🕐"
    case "device_status":
      return "👣"
    default:
      return "🔹"
  }
}

function getTriggerLabel(trigger: Record<string, unknown>): string {
  const type = trigger.type as string
  const label = trigger.label as string
  const entityId = String(trigger.entityId || "")
  const value = trigger.value

  if (label) return label

  switch (type) {
    case "manual":
      return "手动触发"
    case "timer":
      return `定时触发 ${String(value)}`
    case "time": {
      const lowerEntityId = entityId.toLowerCase()
      if (lowerEntityId === "timer") {
        return `定时 ${String(value)}`
      }
      if (lowerEntityId === "sunrise_sunset" || entityId === "日出" || entityId === "日落") {
        if (entityId === "日出") return "日出"
        if (entityId === "日落") return "日落"
        return String(value).toLowerCase() === "sunrise" ? "日出" : "日落"
      }
      if (lowerEntityId === "cycle" || entityId === "周期定时器") {
        if (typeof value === "object" && value !== null) {
          const valObj = value as Record<string, unknown>
          const interval = valObj.interval ?? 30
          const unit = valObj.unit ?? "minute"
          const unitText = unit === "minute" ? "分钟" : unit === "hour" ? "小时" : unit === "day" ? "天" : String(unit)
          return `每${interval}${unitText}`
        }
        return `周期触发 ${String(value)}`
      }
      return `${entityId} ${String(value)}`
    }
    case "device_status": {
      if (typeof value === "string") {
        if (value.toLowerCase() === "pir" || value.toLowerCase() === "motion") {
          return `检测到人移动`
        }
        if (value.toLowerCase() === "open") {
          return `检测到打开`
        }
        if (value.toLowerCase() === "close") {
          return `检测到关闭`
        }
        if (value.toLowerCase() === "alarm") {
          return `检测到告警`
        }
      }
      if (entityId === "temp_humidity_sensor" && typeof value === "object" && value !== null) {
        const valObj = value as Record<string, unknown>
        if ("temperature" in valObj) {
          const tempObj = valObj.temperature as Record<string, unknown>
          if ("gt" in tempObj) return `温度 > ${tempObj.gt}℃`
          if ("lt" in tempObj) return `温度 < ${tempObj.lt}℃`
        }
        if ("humidity" in valObj) {
          const humObj = valObj.humidity as Record<string, unknown>
          if ("gt" in humObj) return `湿度 > ${humObj.gt}%`
          if ("lt" in humObj) return `湿度 < ${humObj.lt}%`
        }
      }
      if (entityId === "light_sensor" && typeof value === "object" && value !== null) {
        const valObj = value as Record<string, unknown>
        if ("illuminance" in valObj) {
          const illObj = valObj.illuminance as Record<string, unknown>
          if ("gt" in illObj) return `光照 > ${illObj.gt}lux`
          if ("lt" in illObj) return `光照 < ${illObj.lt}lux`
        }
      }
      return `状态变化`
    }
    default:
      return `状态变化`
  }
}

function getActionIcon(type: string): string {
  switch (type) {
    case "device_control":
      return "💡"
    case "delay":
      return "⏱️"
    case "notification":
      return "🔔"
    default:
      return "▶️"
  }
}

function getActionLabel(action: Record<string, unknown>): string {
  const type = action.type as string
  const label = action.label as string
  const entityId = String(action.entityId || "")
  const value = action.value

  if (label) return label

  switch (type) {
    case "device_control": {
      if (typeof value === "object" && value !== null) {
        const valObj = value as Record<string, unknown>
        if ("mode" in valObj && "temperature" in valObj) {
          const mode = String(valObj.mode)
          const modeText = mode === "cool" ? "制冷" : mode === "heat" ? "制热" : mode === "auto" ? "自动" : mode
          return `${entityId} ${modeText} ${valObj.temperature}°C`
        }
        if ("switch" in valObj) {
          const speed = "speed" in valObj ? ` ${speedText(String(valObj.speed))}` : ""
          const onText = entityId === "light" ? (valObj.switch ? "开启" : "熄灭") : (valObj.switch ? "开启" : "关闭")
          return `${entityId} ${onText}${speed}`
        }
        if ("control" in valObj) {
          return `${entityId} ${valObj.control === "open" ? "开启" : "关闭"}`
        }
        if ("lock" in valObj) {
          return `${entityId} ${valObj.lock ? "上锁" : "解锁"}`
        }
        if ("start" in valObj) {
          return `${entityId} 开始清扫`
        }
      }
      return `${entityId}`
    }
    case "delay": {
      const seconds = Number(action.value) || 0
      const minutes = Math.floor(seconds / 60)
      if (minutes > 0) {
        return `等待 ${minutes} 分钟（${seconds} 秒）`
      }
      return `等待 ${seconds} 秒`
    }
    case "notification":
      return `推送通知: ${String(action.value)}`
    default:
      return type
  }
}

function speedText(speed: string): string {
  switch (speed) {
    case "low":
      return "低速"
    case "medium":
      return "中速"
    case "high":
      return "高速"
    default:
      return speed
  }
}

interface EditState {
  triggers: Record<string, unknown>[]
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
}

interface AddPanelState {
  type: "trigger" | "action" | null
}

export function RuleCard() {
  const { generatedRule, executeRule, generationError, executionResult, saveRule, updateRule, devices } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<EditState>({ triggers: [], conditions: [], actions: [] })
  const [showAddPanel, setShowAddPanel] = useState<AddPanelState>({ type: null })
  const [editingIndex, setEditingIndex] = useState<{ type: 'trigger' | 'condition' | 'action'; index: number | null }>({ type: 'trigger', index: null })
  const [searchKeyword, setSearchKeyword] = useState("")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportYAML, setExportYAML] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)

  const ruleObj = generatedRule as Record<string, unknown>
  const currentTriggers = isEditing ? editData.triggers : ((ruleObj.triggers as unknown[]) || [])
  const currentConditions = isEditing ? editData.conditions : ((ruleObj.conditions as unknown[]) || [])
  const currentActions = isEditing ? editData.actions : ((ruleObj.actions as unknown[]) || [])

  useEffect(() => {
    if (generationError) {
      toast.error(generationError)
    }
  }, [generationError])

  useEffect(() => {
    if (executionResult) {
      if (executionResult.success) {
        toast.success(executionResult.message)
      } else {
        toast.error(executionResult.message)
      }
    }
  }, [executionResult])

  const handleEnterEdit = () => {
    const triggers = ((ruleObj.triggers as unknown[]) || []).map(t => JSON.parse(JSON.stringify(t)))
    const conditions = ((ruleObj.conditions as unknown[]) || []).map(c => JSON.parse(JSON.stringify(c)))
    const actions = ((ruleObj.actions as unknown[]) || []).map(a => JSON.parse(JSON.stringify(a)))
    setEditData({ triggers, conditions, actions })
    setIsEditing(true)
  }

  const handleExitEdit = () => {
    setIsEditing(false)
    setShowAddPanel({ type: null })
    setEditingIndex({ type: 'trigger', index: null })
  }

  const handleSaveEdit = () => {
    const updatedRule = {
      ...ruleObj,
      triggers: editData.triggers,
      conditions: editData.conditions,
      actions: editData.actions,
      updatedAt: Date.now(),
    }
    updateRule(updatedRule as any)
    saveRule()
    setIsEditing(false)
    setShowAddPanel({ type: null })
    setEditingIndex({ type: 'trigger', index: null })
    toast.success("修改已保存")
  }

  const handleDeleteItem = (type: 'trigger' | 'condition' | 'action', index: number) => {
    setEditData(prev => ({
      ...prev,
      [type + 's']: prev[`${type}s` as keyof EditState].filter((_, i) => i !== index),
    }))
    if (editingIndex.type === type && editingIndex.index === index) {
      setEditingIndex({ type, index: null })
    }
  }

  const handleEditItem = (type: 'trigger' | 'condition' | 'action', index: number) => {
    setEditingIndex({ type, index })
  }

  const handleUpdateItem = (type: 'trigger' | 'condition' | 'action', index: number, field: string, value: unknown) => {
    setEditData(prev => ({
      ...prev,
      [type + 's']: prev[`${type}s` as keyof EditState].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleExportHA = () => {
    if (!generatedRule) {
      toast.error("请先生成规则")
      return
    }
    try {
      const yaml = generateHAYAML(generatedRule as unknown as SceneRule)
      setExportYAML(yaml)
      setShowExportDialog(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`导出失败：${msg}`)
    }
  }

  const handleCopyYAML = async () => {
    try {
      await navigator.clipboard.writeText(exportYAML)
      toast.success("YAML 已复制")
    } catch {
      toast.error("复制失败，请手动选择复制")
    }
  }

  const deviceOptions = devices.map(d => ({ value: d.name, label: `${d.name} (${d.category})` }))
  const actionTypeOptions = [
    { value: 'switch', label: '开关' },
    { value: 'temp', label: '温度' },
    { value: 'control', label: '窗帘控制' },
    { value: 'lock', label: '门锁' },
  ]

  const renderEditInput = (type: 'trigger' | 'condition' | 'action', item: Record<string, unknown>, index: number) => {
    const isEditingThis = editingIndex.type === type && editingIndex.index === index

    if (!isEditingThis) {
      return (
        <>
          <p className="text-sm font-medium truncate">
            {type === 'trigger' ? getTriggerLabel(item) : type === 'condition' ? getConditionDisplay(item).text : getActionLabel(item)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {type === 'trigger' ? `类型: ${String(item.type)}` : type === 'condition' ? `类型: ${String(item.type)}` : `设备: ${String(item.entityId)}`}
          </p>
        </>
      )
    }

    return (
      <div className="space-y-2 w-full">
        <Select
          value={String(item.entityId)}
          onValueChange={(v) => handleUpdateItem(type, index, 'entityId', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择设备" />
          </SelectTrigger>
          <SelectContent>
            {deviceOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {type === 'action' && (
          <Select
            value={typeof item.value === 'object' && item.value !== null && 'switch' in item.value ? 'switch' : 'temp'}
            onValueChange={(v) => {
              const newValue = v === 'switch' ? { switch: true } : v === 'temp' ? { temp: 25 } : { control: 'open' }
              handleUpdateItem(type, index, 'value', newValue)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="动作类型" />
            </SelectTrigger>
            <SelectContent>
              {actionTypeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {type === 'trigger' && (
          <input
            type="text"
            value={String(item.value)}
            onChange={(e) => handleUpdateItem(type, index, 'value', e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
            placeholder="值"
          />
        )}
      </div>
    )
  }

  return (
    <>
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏠</div>
          <div>
            <CardTitle className="text-lg font-bold">{String(ruleObj.name)}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              智能场景规则
              <span className="text-xs text-muted-foreground">
                {currentTriggers.length} 触发 · {currentConditions.length} 条件 · {currentActions.length} 动作
              </span>
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {isEditing ? (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleExitEdit(); }} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEnterEdit(); }} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={`flex-1 overflow-y-auto space-y-6 transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>📌</span>
            触发条件
            {isEditing && (
              <Button variant="ghost" size="icon" onClick={() => setShowAddPanel({ type: 'trigger' })} className="h-6 w-6 ml-auto">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </h3>
          <div className="space-y-2">
            {currentTriggers.map((trigger, index) => {
              const t = trigger as Record<string, unknown>
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-md bg-muted/50 p-3 hover:bg-muted transition-colors"
                >
                  <span className="text-xl">{getTriggerIcon(String(t.type))}</span>
                  <div className="flex-1 min-w-0">
                    {renderEditInput('trigger', t, index)}
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => editingIndex.type === 'trigger' && editingIndex.index === index ? setEditingIndex({ type: 'trigger', index: null }) : handleEditItem('trigger', index)}
                      >
                        {editingIndex.type === 'trigger' && editingIndex.index === index ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteItem('trigger', index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {isEditing && showAddPanel.type === 'trigger' && (
            <div className="rounded-md bg-muted/50 p-3 border border-dashed border-muted-foreground">
              <div className="space-y-2">
                <Select defaultValue="" onValueChange={(v) => {
                  const newItem = { type: 'device_status', entityId: v, value: 'pir', operator: '==', label: '' }
                  setEditData(prev => ({ ...prev, triggers: [...prev.triggers, newItem] }))
                  setShowAddPanel({ type: null })
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择触发设备" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full" onClick={() => setShowAddPanel({ type: null })}>取消</Button>
              </div>
            </div>
          )}
        </div>

        {currentConditions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span>⚙️</span>
              附加条件
            </h3>
            <div className="space-y-2">
              {currentConditions.map((condition, index) => {
                const c = condition as Record<string, unknown>
                return (
                  <div
                  key={index}
                  className="flex items-start gap-3 rounded-md bg-amber-50 p-3 border border-amber-100"
                >
                  <span className="text-xl">{getConditionDisplay(c).icon}</span>
                  <div className="flex-1 min-w-0">
                    {renderEditInput('condition', c, index)}
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => editingIndex.type === 'condition' && editingIndex.index === index ? setEditingIndex({ type: 'condition', index: null }) : handleEditItem('condition', index)}
                        >
                          {editingIndex.type === 'condition' && editingIndex.index === index ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteItem('condition', index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>🎯</span>
            执行动作
            {isEditing && (
              <Button variant="ghost" size="icon" onClick={() => setShowAddPanel({ type: 'action' })} className="h-6 w-6 ml-auto">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </h3>
          {currentActions.length > 10 && (
            <Input
              placeholder="搜索动作..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="h-8 text-sm"
            />
          )}
          <div className="space-y-2">
            {currentActions.filter((action) => {
              const entityId = String((action as Record<string, unknown>).entityId || "")
              return entityId.toLowerCase().includes(searchKeyword.toLowerCase())
            }).map((action, index) => {
              const actionObj = action as Record<string, unknown>
              const isDeviceControl = actionObj.type === "device_control"
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 rounded-md p-3 transition-colors ${
                    isDeviceControl ? "bg-green-50 border border-green-100 hover:bg-green-100" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-xl">{getActionIcon(String(actionObj.type))}</span>
                  <div className="flex-1 min-w-0">
                    {renderEditInput('action', actionObj, index)}
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => editingIndex.type === 'action' && editingIndex.index === index ? setEditingIndex({ type: 'action', index: null }) : handleEditItem('action', index)}
                      >
                        {editingIndex.type === 'action' && editingIndex.index === index ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteItem('action', index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {isEditing && showAddPanel.type === 'action' && (
            <div className="rounded-md bg-muted/50 p-3 border border-dashed border-muted-foreground">
              <div className="space-y-2">
                <Select defaultValue="" onValueChange={(v) => {
                  const newItem = { type: 'device_control', entityId: v, value: { switch: true }, label: '' }
                  setEditData(prev => ({ ...prev, actions: [...prev.actions, newItem] }))
                  setShowAddPanel({ type: null })
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择执行设备" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="switch" onValueChange={(v) => {
                  const newValue = v === 'switch' ? { switch: true } : v === 'temp' ? { temp: 25 } : { control: 'open' }
                  setEditData(prev => {
                    const lastIndex = prev.actions.length - 1
                    return {
                      ...prev,
                      actions: prev.actions.map((a, i) => i === lastIndex ? { ...a, value: newValue } : a)
                    }
                  })
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="动作类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full" onClick={() => setShowAddPanel({ type: null })}>取消</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4 border-t bg-muted/30 space-y-2">
        {isEditing ? (
          <>
            <Button variant="outline" className="w-full" onClick={handleExitEdit}>取消</Button>
            <Button className="w-full" onClick={handleSaveEdit}>保存修改</Button>
          </>
        ) : (
          <>
            <Button variant="outline" className="w-full" onClick={() => saveRule()}>
              💾 保存场景
            </Button>
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white border-0"
                onClick={handleExportHA}
              >
                📥 导出 HA
              </Button>
              <Button className="flex-1" onClick={() => executeRule()}>
                🚀 一键下发
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>

    <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导出到 Home Assistant</DialogTitle>
          <DialogDescription>
            将以下 YAML 内容复制到 Home Assistant 的 automations.yaml 文件中，重载自动化即可生效。
          </DialogDescription>
        </DialogHeader>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap break-all">
          <code>{exportYAML}</code>
        </pre>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowExportDialog(false)}>关闭</Button>
          <Button onClick={handleCopyYAML}>复制到剪贴板</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}