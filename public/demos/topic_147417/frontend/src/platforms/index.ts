import type { Device } from "@/engine/types"

export interface BasePlatform {
  connect(credentials: Record<string, string>): Promise<boolean>
  disconnect(): void
  getDevices(): Promise<Device[]>
  executeRule(rule: object): Promise<{ success: boolean; message: string }>
}