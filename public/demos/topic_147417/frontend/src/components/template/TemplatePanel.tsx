import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/stores/useAppStore"
import type { ParamType, Device, DeviceType } from "@/engine/types"
import { defaultDeviceNames } from "@/engine/defaultDevices"
import { Clock, Sun, Bed, Home, Film, Wind } from "lucide-react"
import { useState } from "react"

const iconMap: Record<string, React.ReactNode> = {
  "template-night-light": <Bed className="h-5 w-5" />,
  "template-leave-home": <Home className="h-5 w-5" />,
  "template-welcome-home": <Sun className="h-5 w-5" />,
  "template-movie-night": <Film className="h-5 w-5" />,
  "template-window-aircon": <Wind className="h-5 w-5" />,
}

function ParamInput({
  paramKey,
  label,
  type,
  required,
  value,
  onChange,
  devices,
  deviceType,
  defaultName,
}: {
  paramKey: string
  label: string
  type: ParamType
  required: boolean
  value: string
  onChange: (key: string, value: string) => void
  devices: Device[]
  deviceType?: DeviceType
  defaultName?: string
}) {
  const hasConnectedDevices = devices.length > 0

  const deviceCategoryMap: Record<DeviceType, string> = {
    light: "light",
    switch: "switch",
    curtain: "curtain",
    tv: "tv",
    ac: "air_conditioner",
    sensor: "sensor",
    lock: "lock",
    speaker: "speaker",
    camera: "camera",
    fan: "fan",
    heater: "heater",
    purifier: "purifier",
    robot: "robot",
  }

  const selectOptions = hasConnectedDevices && deviceType
    ? (devices.filter((d) => d.category === deviceCategoryMap[deviceType]).length > 0
        ? devices.filter((d) => d.category === deviceCategoryMap[deviceType]).map((d) => ({ value: d.name, label: `${d.name} (${d.category})` }))
        : deviceType
        ? defaultDeviceNames[deviceType]?.map((name) => ({ value: name, label: name })) || []
        : [])
    : deviceType
    ? defaultDeviceNames[deviceType]?.map((name) => ({ value: name, label: name })) || []
    : defaultName
    ? [{ value: defaultName, label: defaultName }]
    : []

  const defaultValue = value || (defaultName && !hasConnectedDevices ? defaultName : "")

  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          {label}
          {required && <span className="text-destructive">*</span>}
        </span>
      </label>
      {(type === "device" || type === "deviceSelect") && (
        <Select value={defaultValue} onValueChange={(v) => onChange(paramKey, v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectOptions.length > 0 ? "选择设备" : "请先连接涂鸦平台"} />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.length > 0 ? (
              selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                暂无设备，请先连接涂鸦平台
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
      {type === "time" && (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(paramKey, e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      {type === "number" && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(paramKey, e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      {type === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(paramKey, e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  )
}

export function TemplatePanel() {
  const {
    templates,
    devices,
    selectedTemplateId,
    selectedTemplateParams,
    generationError,
    setSelectedTemplateId,
    updateParam,
    generateRule,
  } = useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedTemplate = templates.find((t) => t.id === selectedId)

  const handleCardClick = (templateId: string) => {
    setSelectedId(templateId)
    setSelectedTemplateId(templateId)
    setDialogOpen(true)
  }

  const handleGenerate = () => {
    generateRule()
  }

  return (
    <div className="grid h-full gap-4 overflow-y-auto sm:grid-cols-1 lg:grid-cols-2">
      {templates.map((template) => (
        <Dialog key={template.id} open={dialogOpen && selectedId === template.id}>
          <DialogTrigger asChild>
            <Card
              className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                selectedTemplateId === template.id
                  ? "border-primary ring-2 ring-primary/20"
                  : ""
              }`}
              onClick={() => handleCardClick(template.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {iconMap[template.id] ?? <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {template.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      #{keyword}
                    </span>
                  ))}
                  {template.keywords.length > 3 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{template.keywords.length - 3}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {generationError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {generationError}
                </div>
              )}
              {selectedTemplate?.params.map((param) => {
                const { key, deviceType, defaultName, ...rest } = param
                return (
                  <ParamInput
                    key={key}
                    {...rest}
                    paramKey={key}
                    value={selectedTemplateParams[key] || ""}
                    onChange={updateParam}
                    devices={devices}
                    deviceType={deviceType}
                    defaultName={defaultName}
                  />
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleGenerate} disabled={selectedTemplateId === null}>
                生成规则
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
