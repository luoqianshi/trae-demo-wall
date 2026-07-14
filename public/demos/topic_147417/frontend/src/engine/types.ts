export type ParamType = "device" | "deviceSelect" | "time" | "number" | "text"

export type DeviceType =
  | "light"
  | "switch"
  | "curtain"
  | "tv"
  | "ac"
  | "sensor"
  | "lock"
  | "speaker"
  | "camera"
  | "fan"
  | "heater"
  | "purifier"
  | "robot"

export type DeviceCategory =
  | "light"
  | "switch"
  | "curtain"
  | "air_conditioner"
  | "heater"
  | "camera"
  | "sensor"
  | "lock"
  | "speaker"
  | "tv"
  | "fan"
  | "purifier"
  | "robot"

export interface ParamDef {
  key: string
  label: string
  type: ParamType
  required: boolean
  defaultValue?: string | number | boolean
  deviceType?: DeviceType
  defaultName?: string
}

export interface Trigger {
  id: string
  type: string
  entityId: string
  value: unknown
  operator?: string
  label?: string
}

export interface Condition {
  id: string
  type: string
  entityId: string
  value: unknown
  operator?: string
  label?: string
}

export interface Action {
  id: string
  type: string
  entityId: string
  value: unknown
  label?: string
  delay?: number
}

export interface SceneRule {
  id: string
  name: string
  description?: string
  triggers: Trigger[]
  conditions?: Condition[]
  actions: Action[]
  enabled: boolean
  createdAt: number
  updatedAt: number
  platform: string
  tuyaSceneId?: string
}

export interface SceneTemplate {
  id: string
  name: string
  description: string
  keywords: string[]
  params: ParamDef[]
  triggers: Omit<Trigger, "id">[]
  conditions?: Omit<Condition, "id">[]
  actions: Omit<Action, "id">[]
}

export interface TuyaSceneConfig {
  name: string
  background: string
  preconditions: Array<{
    cond_type: string
    cond_code: string
    cond_value: unknown
  }>
  actions: Array<{
    entity_id: string
    action_code: string
    action_value: unknown
    execute_type: string
  }>
  match_type: 0 | 1
}

export interface TuyaDevice {
  id: string
  name: string
  category: string
  online: boolean
  product_id: string
  icon: string
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  category: DeviceCategory
  platform: string
  online: boolean
  room?: string
  status?: Record<string, unknown>
}
