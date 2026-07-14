import { useState, useCallback } from "react"
import type { SceneRule, Trigger, Action, Condition, DeviceType, Device } from "@/engine/types"
import { generateRuleByAI } from "@/engine/aiService"
import { parseNaturalLanguage, fillTemplate } from "@/engine/templateParser"
import { generateTuyaRule, validateRule } from "@/engine/ruleGenerator"
import { getAIConfig } from "@/stores/useAIConfigStore"
import { useAppStore } from "@/stores/useAppStore"
import { defaultDeviceNames } from "@/engine/defaultDevices"

type AIErrorType = "ai_failure" | "device_filtered" | null

interface UseSmartHomeAIResult {
  isAILoading: boolean
  aiError: string | null
  aiErrorType: AIErrorType
  aiDuration: number | null
  generateRule: (userInput: string) => Promise<SceneRule | null>
}

const deviceTypeToCategory: Record<string, string> = {
  sensor: "sensor",
  light: "light",
  ac: "ac",
  curtain: "curtain",
  fan: "fan",
  camera: "camera",
  switch: "switch",
  lock: "lock",
  speaker: "speaker",
  heater: "heater",
  purifier: "purifier",
  robot: "robot",
  tv: "tv",
}

const deviceTypeChinese: Record<string, string> = {
  light: "照明",
  switch: "插座",
  ac: "空调",
  curtain: "窗帘",
  fan: "风扇",
  tv: "电视",
  speaker: "音箱",
  lock: "门锁",
  camera: "摄像头",
  heater: "取暖器",
  purifier: "净化器",
  robot: "扫地机器人",
  sensor: "传感器",
}

function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

function getDeviceDisplayName(device: Device): string {
  if (containsChinese(device.name)) {
    return device.name
  }
  const categoryLabel = deviceTypeChinese[device.type] || device.type
  return `${device.name}（${categoryLabel}）`
}

function normalizeActionValue(value: unknown): unknown {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim()
    if (lowerValue === "on" || lowerValue === "开" || lowerValue === "打开") {
      return { switch: true }
    }
    if (lowerValue === "off" || lowerValue === "关" || lowerValue === "关闭") {
      return { switch: false }
    }
    if (lowerValue === "open") {
      return { control: "open" }
    }
    if (lowerValue === "close") {
      return { control: "close" }
    }
  }
  return value
}

function mapTriggerEntityId(entityId: string, triggerValue: unknown): string {
  if (entityId === "timer") return "定时器"
  if (entityId === "sunrise_sunset") {
    return triggerValue === "sunrise" ? "日出" : "日落"
  }
  if (entityId === "cycle") return "周期定时器"
  if (entityId === "scene_button") return "一键执行"

  const sensorMap: Record<string, string> = {
    motion_sensor: "客厅人体传感器",
    contact_sensor: "门窗传感器",
    smoke_sensor: "烟雾传感器",
    temp_humidity_sensor: "温湿度传感器",
    light_sensor: "光照传感器",
    leak_sensor: "水浸传感器",
  }
  if (sensorMap[entityId]) return sensorMap[entityId]

  return mapEntityId(entityId)
}

function mapEntityId(entityId: string): string {
  const devices = useAppStore.getState().devices
  const category = deviceTypeToCategory[entityId]

  if (category && devices.length > 0) {
    const matchedDevice = devices.find((d) => d.category === category)
    if (matchedDevice) {
      return getDeviceDisplayName(matchedDevice)
    }
  }

  const defaultNames = defaultDeviceNames[entityId as DeviceType]
  if (defaultNames && defaultNames.length > 0) {
    return defaultNames[0]
  }

  return entityId
}

interface FilterResult {
  rule: SceneRule
  filteredActionNames: string[]
}

function filterRuleByDevices(rule: SceneRule, devices: Device[]): FilterResult {
  if (devices.length === 0) return { rule, filteredActionNames: [] }

  const validDeviceTypes = new Set<string>(devices.map((d) => d.type))
  const validDeviceNames = new Set(devices.map((d) => d.name))
  const validDeviceCategories: Set<string> = new Set(devices.map((d) => d.category))

  const deviceByType = new Map<string, Device>()
  for (const d of devices) {
    if (!deviceByType.has(d.type)) {
      deviceByType.set(d.type, d)
    }
  }

  const filteredActionNames: string[] = []

  const filteredActions = (rule.actions || []).filter((action) => {
    const actionEntityId = action.entityId

    if (validDeviceTypes.has(actionEntityId) || validDeviceNames.has(actionEntityId)) {
      return true
    }

    for (const [type, device] of deviceByType) {
      const lowerAction = actionEntityId.toLowerCase()
      if (lowerAction.includes(type.toLowerCase()) || lowerAction.includes(device.category.toLowerCase())) {
        return true
      }
    }

    const category = deviceTypeToCategory[actionEntityId]
    if (category && validDeviceCategories.has(category)) {
      return true
    }

    console.warn(`过滤掉无效设备的 action: ${actionEntityId}`)
    filteredActionNames.push(actionEntityId)
    return false
  })

  const filteredTriggers = (rule.triggers || []).filter((trigger) => {
    if (trigger.type === "manual") return true
    if (trigger.type === "time") return true

    const sensorTypes = new Set(["motion_sensor", "contact_sensor", "smoke_sensor", "temp_humidity_sensor", "light_sensor", "leak_sensor"])
    if (sensorTypes.has(trigger.entityId)) {
      const isValid = validDeviceTypes.has("sensor")
      if (!isValid) {
        console.warn(`过滤掉无效传感器的 trigger: ${trigger.entityId}`)
      }
      return isValid
    }
    return true
  })

  return {
    rule: {
      ...rule,
      actions: filteredActions,
      triggers: filteredTriggers,
    },
    filteredActionNames,
  }
}

function generateRuleName(rule: SceneRule): string {
  const triggerText = rule.triggers.map((t) => {
    if (t.type === "device_status") {
      if (t.entityId === "motion_sensor") return "有人移动"
      if (t.entityId === "contact_sensor") {
        const val = String(t.value).toLowerCase()
        return `门窗${val === "open" ? "打开" : "关闭"}`
      }
      if (t.entityId === "smoke_sensor") return "烟雾告警"
      if (t.entityId === "temp_humidity_sensor") {
        if (typeof t.value === "object" && t.value !== null) {
          const v = t.value as Record<string, unknown>
          if (v.temperature) {
            const temp = v.temperature as Record<string, number>
            if (temp.gt) return `温度>${temp.gt}°C`
            if (temp.lt) return `温度<${temp.lt}°C`
          }
          if (v.humidity) {
            const hum = v.humidity as Record<string, number>
            if (hum.gt) return `湿度>${hum.gt}%`
            if (hum.lt) return `湿度<${hum.lt}%`
          }
        }
      }
      if (t.entityId === "light_sensor") return "光线暗"
    }
    if (t.type === "time") {
      if (t.entityId === "timer") {
        const val = typeof t.value === "object" ? JSON.stringify(t.value) : String(t.value)
        return `定时${val}`
      }
      if (t.entityId === "sunrise_sunset") {
        const val = String(t.value).toLowerCase()
        return val === "sunrise" ? "日出" : "日落"
      }
      if (t.entityId === "cycle") {
        if (typeof t.value === "object" && t.value !== null) {
          const v = t.value as Record<string, unknown>
          const interval = v.interval ?? 30
          const unit = v.unit ?? "minute"
          const unitText = unit === "minute" ? "分钟" : unit === "hour" ? "小时" : unit === "day" ? "天" : String(unit)
          return `每${interval}${unitText}`
        }
      }
    }
    if (t.type === "manual") return "手动触发"
    return ""
  }).filter(Boolean).join("，")

  let actionText = ""
  const isManualTrigger = rule.triggers.some(t => t.type === "manual")
  const hasMultipleActions = rule.actions.length > 4

  if (isManualTrigger && hasMultipleActions) {
    const allOff = rule.actions.every(a => {
      if (typeof a.value === "object" && a.value !== null) {
        const v = a.value as Record<string, unknown>
        return v.switch === false
      }
      return false
    })
    actionText = allOff ? "关闭所有电器" : "执行场景动作"
  } else if (rule.actions.length > 0) {
    const a = rule.actions[0]
    const deviceName = mapEntityId(a.entityId)
    if (typeof a.value === "object" && a.value !== null) {
      const v = a.value as Record<string, unknown>
      if (v.switch === true) actionText = `开${deviceName}`
      else if (v.switch === false) actionText = `关${deviceName}`
      else if (v.control === "open") actionText = `${deviceName}打开`
      else if (v.control === "close") actionText = `${deviceName}关闭`
      else actionText = `${deviceName}动作`
    } else {
      actionText = `${deviceName}动作`
    }
  }

  if (triggerText && actionText) return `${triggerText}${actionText}`
  if (triggerText) return triggerText
  return rule.name
}

function processAIRule(rule: SceneRule): SceneRule {
  const triggers = rule.triggers || []
  const sanitizedTriggers = triggers.map((trigger) => {
    if (trigger.type === "time") {
      const rawEntityId = String(trigger.entityId || "").toLowerCase()
      const rawValue = String(trigger.value || "").toLowerCase()
      const hasSunriseInId = rawEntityId.includes("sunrise")
      const hasSunsetInId = rawEntityId.includes("sunset")

      if (rawValue === "sunrise") {
        return { ...trigger, entityId: "sunrise_sunset", value: "sunrise" }
      }
      if (rawValue === "sunset") {
        return { ...trigger, entityId: "sunrise_sunset", value: "sunset" }
      }

      if (typeof trigger.value === "object" && trigger.value !== null) {
        const valObj = trigger.value as Record<string, unknown>
        if ("sunrise" in valObj || "sunset" in valObj) {
          return [
            { ...trigger, entityId: "sunrise_sunset", value: "sunrise" },
            { ...trigger, entityId: "sunrise_sunset", value: "sunset" }
          ]
        }
      }

      if (hasSunriseInId && hasSunsetInId) {
        return [
          { ...trigger, entityId: "sunrise_sunset", value: "sunrise" },
          { ...trigger, entityId: "sunrise_sunset", value: "sunset" }
        ]
      }
      if (hasSunriseInId) {
        return { ...trigger, entityId: "sunrise_sunset", value: "sunrise" }
      }
      if (hasSunsetInId) {
        return { ...trigger, entityId: "sunrise_sunset", value: "sunset" }
      }

      const valueIsCycleObj = typeof trigger.value === "object" && trigger.value !== null && "interval" in (trigger.value as Record<string, unknown>)
      if (rawEntityId === "cycle" || rawValue.includes("interval") || valueIsCycleObj) {
        try {
          const parsedValue = typeof trigger.value === "string" ? JSON.parse(trigger.value) : trigger.value
          return { ...trigger, entityId: "cycle", value: parsedValue }
        } catch {
          return { ...trigger, entityId: "cycle", value: { interval: 30, unit: "minute" } }
        }
      }
    }
    return trigger
  }).flat()

  const processedTriggers: Trigger[] = sanitizedTriggers.map((trigger) => ({
    ...trigger,
    entityId: mapTriggerEntityId(trigger.entityId, trigger.value),
  }))

  const processedActions: Action[] = (rule.actions || []).map((action) => ({
    ...action,
    entityId: mapEntityId(action.entityId),
    value: normalizeActionValue(action.value),
  }))

  const processedConditions: Condition[] = (rule.conditions || []).map((condition) => ({
    ...condition,
    entityId: mapEntityId(condition.entityId),
  }))

  rule.name = generateRuleName(rule)

  return {
    ...rule,
    triggers: processedTriggers,
    actions: processedActions,
    conditions: processedConditions,
  }
}

export function useSmartHomeAI(): UseSmartHomeAIResult {
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiErrorType, setAiErrorType] = useState<AIErrorType>(null)
  const [aiDuration, setAiDuration] = useState<number | null>(null)

  const generateByTemplate = useCallback(
    (userInput: string): SceneRule | null => {
      const result = parseNaturalLanguage(userInput)

      if (!result) {
        return null
      }

      const { templateId, extractedParams } = result

      try {
        const filledRule = fillTemplate(templateId, extractedParams)
        const tuyaRule = generateTuyaRule(filledRule)
        const validation = validateRule(tuyaRule)

        if (!validation.valid) {
          return null
        }

        return tuyaRule as SceneRule
      } catch {
        return null
      }
    },
    []
  )

  const generateRule = useCallback(
    async (userInput: string): Promise<SceneRule | null> => {
      const startTime = Date.now()
      setIsAILoading(true)
      setAiError(null)
      setAiErrorType(null)
      setAiDuration(null)

      try {
        const config = getAIConfig()
        const devices = useAppStore.getState().devices

        if (!config.apiKey) {
          return generateByTemplate(userInput)
        }

        const aiRule = await generateRuleByAI(userInput, config, devices)

        if (aiRule) {
          const filterResult = filterRuleByDevices(aiRule, devices)
          if (filterResult.rule.actions.length === 0) {
            const missingDevices = filterResult.filteredActionNames.join("、")
            setAiErrorType("device_filtered")
            setAiError(
              `当前场景需要的设备尚未接入（${missingDevices}），请先连接对应设备或更换场景`
            )
            return null
          }
          const processedRule = processAIRule(filterResult.rule)
          const duration = (Date.now() - startTime) / 1000
          setAiDuration(duration)
          return processedRule
        }

        return generateByTemplate(userInput)
      } catch (error) {
        console.warn("AI 生成失败，回退到模板引擎:", error)
        setAiErrorType("ai_failure")
        setAiError(error instanceof Error ? error.message : "AI 生成失败")
        return generateByTemplate(userInput)
      } finally {
        setIsAILoading(false)
      }
    },
    [generateByTemplate]
  )

  return {
    isAILoading,
    aiError,
    aiErrorType,
    aiDuration,
    generateRule,
  }
}