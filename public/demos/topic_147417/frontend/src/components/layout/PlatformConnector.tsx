import { Button } from "@/components/ui/button"
import { useAppStore } from "@/stores/useAppStore"
import { usePlatformConfigStore } from "@/stores/usePlatformConfigStore"
import { PlatformConfigPanel } from "./PlatformConfigPanel"
import { Wifi, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export function PlatformConnector() {
  const { devices, platformStatus } = useAppStore()
  const { tuyaClientId, tuyaSecret } = usePlatformConfigStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isConnected = platformStatus === "connected"
  const hasCredentials = !!tuyaClientId && !!tuyaSecret

  const getButtonVariant = () => {
    if (isConnected) return "default"
    if (hasCredentials) return "outline"
    return "outline"
  }

  const getButtonStyle = () => {
    if (isConnected) return "bg-green-600 hover:bg-green-700 text-white"
    if (hasCredentials) return "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
    return "border-orange-400 text-orange-600 hover:bg-orange-50"
  }

  const getButtonContent = () => {
    if (isConnected) {
      return (
        <>
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          涂鸦已连接 · {devices.length}台设备
        </>
      )
    }
    if (hasCredentials) {
      return (
        <>
          <AlertTriangle className="mr-1.5 h-4 w-4" />
          验证涂鸦连接
        </>
      )
    }
    return (
      <>
        <Wifi className="mr-1.5 h-4 w-4" />
        连接涂鸦平台
      </>
    )
  }

  const handleButtonClick = () => {
    setIsDialogOpen(true)
  }

  return (
    <>
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={handleButtonClick}
        className={`transition-all ${getButtonStyle()}`}
      >
        {getButtonContent()}
      </Button>

      <PlatformConfigPanel
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}
