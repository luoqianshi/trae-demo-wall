import type { BasePlatform } from "./index"
import type { Device, DeviceType, DeviceCategory } from "@/engine/types"
import { initApi, getDeviceList, sendDeviceCommand, getAccessToken, type TuyaAccessToken } from "./tuyaApi"

const tuyaCategoryToDeviceType: Record<string, DeviceType> = {
  lj: "light",
  dpc: "light",
  xdd: "light",
  dd: "light",
  tdq: "switch",
  kg: "switch",
  cl: "curtain",
  wyf: "curtain",
  tv: "tv",
  kt: "ac",
  ac: "ac",
  cgq: "sensor",
  mr: "sensor",
  ms: "sensor",
  yb: "sensor",
  sj: "sensor",
  lock: "lock",
  spk: "speaker",
  dv: "camera",
  fs: "fan",
  nnq: "heater",
  jhq: "purifier",
  sqj: "robot",
}

const deviceTypeToCategory: Record<DeviceType, DeviceCategory> = {
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

function mapTuyaDevice(tuyaDevice: { id: string; name: string; category: string; online: boolean }): Device {
  const deviceType = tuyaCategoryToDeviceType[tuyaDevice.category] || "sensor"
  return {
    id: tuyaDevice.id,
    name: tuyaDevice.name,
    type: deviceType,
    category: deviceTypeToCategory[deviceType],
    platform: "tuya",
    online: tuyaDevice.online,
  }
}

function getSwitchDpCode(deviceType?: string): string {
  if (deviceType === "light") return "switch_led"
  if (deviceType === "fan") return "switch"
  return "switch_1"
}

function convertToTuyaCommands(action: Record<string, unknown>, deviceType?: string): { code: string; value: unknown }[] {
  const value = action.value as Record<string, unknown> || {}

  const commands: { code: string; value: unknown }[] = []

  if ("switch" in value) {
    commands.push({ code: getSwitchDpCode(deviceType), value: value.switch })
  }

  if ("mode" in value) {
    const modeMap: Record<string, string> = {
      cool: "cool",
      heat: "heat",
      auto: "auto",
      dry: "dry",
      fan: "wind",
    }
    commands.push({ code: "mode", value: modeMap[String(value.mode)] || value.mode })
  }

  if ("temperature" in value) {
    commands.push({ code: "temp_set", value: Number(value.temperature) })
  }

  if ("control" in value) {
    const controlValue = String(value.control)
    commands.push({ code: "control", value: controlValue === "open" ? "open" : "close" })
  }

  if ("lock" in value) {
    commands.push({ code: "lock", value: value.lock })
  }

  if ("speed" in value) {
    const speedMap: Record<string, string> = {
      low: "low",
      medium: "medium",
      high: "high",
    }
    commands.push({ code: "fan_speed", value: speedMap[String(value.speed)] || value.speed })
  }

  if ("start" in value) {
    commands.push({ code: "start", value: value.start })
  }

  return commands
}

export class RealTuyaPlatform implements BasePlatform {
  private devices: Device[] = []

  setDevices(devices: Device[]): void {
    this.devices = devices
  }

  private findDevice(entityId: string): Device | undefined {
    return this.devices.find((d) => d.id === entityId || d.name === entityId)
  }

  async connect(credentials: Record<string, string>): Promise<boolean> {
    try {
      await initApi({
        clientId: credentials.clientId || "",
        secret: credentials.secret || "",
        region: credentials.region || "cn",
      })

      if (credentials.accessToken && credentials.expiresAt) {
        const externalToken: TuyaAccessToken = {
          access_token: credentials.accessToken,
          refresh_token: credentials.refreshToken || "",
          expires_in: Math.max(0, Math.floor((Number(credentials.expiresAt) - Date.now()) / 1000)),
          expires_at: Number(credentials.expiresAt),
        }
        await getAccessToken(externalToken)
      } else {
        await getAccessToken()
      }

      return true
    } catch (error) {
      console.error("RealTuyaPlatform: 连接失败", error)
      return false
    }
  }

  disconnect(): void {
  }

  async getDevices(): Promise<Device[]> {
    try {
      const tuyaDevices = await getDeviceList()
      return tuyaDevices.map(mapTuyaDevice)
    } catch (error) {
      console.error("RealTuyaPlatform: 获取设备列表失败", error)
      return []
    }
  }

  async executeRule(rule: object): Promise<{ success: boolean; message: string }> {
    const ruleObj = rule as Record<string, unknown>
    const actions = ruleObj.actions as unknown[] || []

    let successCount = 0
    const errors: string[] = []

    for (const action of actions) {
      const actionObj = action as Record<string, unknown>
      const entityId = String(actionObj.entityId || "")

      if (!entityId) continue

      try {
        const device = this.findDevice(entityId)
        const actualDeviceId = device?.id || entityId
        const deviceType = device?.type
        const commands = convertToTuyaCommands(actionObj, deviceType)
        if (commands.length === 0) continue

        const success = await sendDeviceCommand(actualDeviceId, commands)
        if (success) {
          successCount++
        } else {
          errors.push(`设备 ${entityId} 控制返回失败`)
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `设备 ${entityId} 控制异常`)
      }
    }

    if (successCount === actions.length && errors.length === 0) {
      return { success: true, message: "场景已下发生效" }
    }

    if (successCount > 0 && errors.length > 0) {
      return { success: false, message: `部分设备控制成功（${successCount}/${actions.length}），错误：${errors.join("; ")}` }
    }

    return { success: false, message: errors.join("; ") || "场景下发失败" }
  }
}