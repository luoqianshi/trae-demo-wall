import type { BasePlatform } from "./index"
import type { Device, DeviceType, DeviceCategory } from "@/engine/types"
import { getFirstDefaultName } from "@/engine/defaultDevices"

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

export class MockTuyaPlatform implements BasePlatform {
  async connect(_credentials: Record<string, string>): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("MockTuyaPlatform: 连接成功")
    return true
  }

  disconnect(): void {
    console.log("MockTuyaPlatform: 已断开")
  }

  async getDevices(): Promise<Device[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const deviceTypes: DeviceType[] = ["sensor", "light", "ac", "curtain", "fan", "camera"]
    const devices: Device[] = []

    deviceTypes.forEach((type, index) => {
      const name = getFirstDefaultName(type) || `设备${index + 1}`
      devices.push({
        id: `dev_mock_${type}_${index}`,
        name,
        type,
        category: deviceTypeToCategory[type],
        platform: "tuya",
        online: Math.random() > 0.3,
      })
    })

    return devices
  }

  async executeRule(rule: object): Promise<{ success: boolean; message: string }> {
    console.log("MockTuyaPlatform: 执行规则", JSON.stringify(rule, null, 2))
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { success: true, message: "场景已模拟下发成功" }
  }
}