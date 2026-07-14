import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { usePlatformConfigStore, regionNames } from "@/stores/usePlatformConfigStore"
import { useAppStore } from "@/stores/useAppStore"
import { Wifi, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface PlatformConfigPanelProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PlatformConfigPanel({ open, onOpenChange }: PlatformConfigPanelProps) {
  const {
    tuyaClientId,
    tuyaSecret,
    tuyaRegion,
    tuyaUserId,
    setTuyaClientId,
    setTuyaSecret,
    setTuyaRegion,
    setTuyaUserId,
    setUseRealApi,
  } = usePlatformConfigStore()

  const { devices, platformStatus, connectTuyaPlatform } = useAppStore()

  const [localClientId, setLocalClientId] = useState(tuyaClientId)
  const [localSecret, setLocalSecret] = useState(tuyaSecret)
  const [localRegion, setLocalRegion] = useState(tuyaRegion)
  const [localUserId, setLocalUserId] = useState(tuyaUserId)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")

  useEffect(() => {
    setLocalClientId(tuyaClientId)
    setLocalSecret(tuyaSecret)
    setLocalRegion(tuyaRegion)
    setLocalUserId(tuyaUserId)
  }, [tuyaClientId, tuyaSecret, tuyaRegion, tuyaUserId])

  const handleTestConnection = async () => {
    if (!localClientId || !localSecret) {
      setTestStatus("error")
      setTestMessage("请先填写 Access ID 和 Access Key")
      return
    }

    setTestStatus("testing")
    setTestMessage("正在连接涂鸦平台...")

    setTuyaClientId(localClientId)
    setTuyaSecret(localSecret)
    setTuyaRegion(localRegion)
    setTuyaUserId(localUserId)
    setUseRealApi(true)

    try {
      await connectTuyaPlatform()

      const { devices: connectedDevices, platformStatus: connectedStatus, generationError } = useAppStore.getState()

      if (connectedStatus === "connected") {
        if (localUserId && connectedDevices.length > 0) {
          setTestStatus("success")
          setTestMessage(`连接成功，${connectedDevices.length} 台设备在线`)
          toast.success(`连接成功，${connectedDevices.length} 台设备在线`)
        } else if (generationError) {
          setTestStatus("error")
          setTestMessage(generationError)
          toast.error(generationError)
        } else {
          setTestStatus("success")
          setTestMessage("Token 获取成功，但未配置用户 UID，使用模拟模式")
          toast.warning("未配置用户 UID，使用模拟模式")
        }
      } else {
        throw new Error("连接失败")
      }
    } catch (error) {
      setTestStatus("error")
      const errorMsg = error instanceof Error ? error.message : "连接失败"
      setTestMessage(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleCancel = () => {
    if (onOpenChange) {
      onOpenChange(false)
    }
    setTestStatus("idle")
    setTestMessage("")
  }

  const isConnected = platformStatus === "connected"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-500" />
            连接涂鸦智能平台
          </DialogTitle>
          <DialogDescription>
            填入 API 凭据和用户 UID，通过简单模式获取你的个人设备
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Access ID (Client ID)</label>
            <Input
              value={localClientId}
              onChange={(e) => setLocalClientId(e.target.value)}
              placeholder="输入您的 Access ID"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Access Key</label>
            <Input
              type="password"
              value={localSecret}
              onChange={(e) => setLocalSecret(e.target.value)}
              placeholder="输入您的 Access Key"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">涂鸦 App 用户 UID</label>
            <Input
              value={localUserId}
              onChange={(e) => setLocalUserId(e.target.value)}
              placeholder="输入涂鸦 App 用户 UID"
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              在涂鸦 IoT 平台关联 App 账号后可获得，通常为纯数字
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">数据中心区域</label>
            <Select value={localRegion} onValueChange={(v) => setLocalRegion(v as typeof localRegion)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择数据中心" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(regionNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              前往
              <a
                href="https://iot.tuya.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline mx-1"
              >
                涂鸦 IoT 平台
              </a>
              获取 API 凭据
            </p>
          </div>

          {testStatus !== "idle" && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              testStatus === "success" ? "bg-green-500/10 border border-green-500/30" :
              testStatus === "error" ? "bg-red-500/10 border border-red-500/30" :
              "bg-blue-500/10 border border-blue-500/30"
            }`}>
              {testStatus === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {testStatus === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
              {testStatus === "testing" && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
              <span className={`text-sm ${
                testStatus === "success" ? "text-green-600" :
                testStatus === "error" ? "text-red-600" : "text-blue-600"
              }`}>
                {testMessage}
              </span>
            </div>
          )}

          {isConnected && testStatus === "idle" && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">
                已连接，共 {devices.length} 台设备
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="mr-1 h-4 w-4" />
            取消
          </Button>
          <Button size="sm" onClick={handleTestConnection} disabled={testStatus === "testing"}>
            {testStatus === "testing" ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="mr-1 h-4 w-4" />
            )}
            测试连接并保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
