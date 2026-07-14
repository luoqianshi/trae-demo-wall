import type { SceneRule, SceneTemplate, Trigger, Condition, Action, DeviceType } from "./types"
import { defaultTemplates } from "./templates"
import { defaultDeviceNames } from "./defaultDevices"

const deviceWords: Record<DeviceType, string[]> = {
  light: ["灯", "灯光", "照明", "亮灯", "开灯", "夜灯"],
  switch: ["插座", "开关", "电源"],
  curtain: ["窗帘", "窗", "百叶", "关窗帘", "拉窗帘"],
  tv: ["电视", "电视", "投影"],
  ac: ["空调", "冷气", "暖气", "制冷", "制热", "调温"],
  sensor: ["传感器", "感应器", "探头", "烟雾", "报警", "下雨", "门窗", "窗户", "开门", "开窗", "有人", "人动", "移动", "检测到人"],
  lock: ["锁", "门锁", "密码锁", "开门", "关门", "锁门"],
  speaker: ["音箱", "音响", "喇叭", "播放", "播报", "语音", "通知我", "提醒"],
  camera: ["摄像头", "监控", "相机", "查看", "录像"],
  fan: ["风扇", "排风", "抽风", "通风", "换气"],
  heater: ["取暖器", "暖气", "电热"],
  purifier: ["净化器", "清新器"],
  robot: ["机器人", "扫地机"],
}

export function extractTime(input: string): string | null {
  const lowerInput = input.toLowerCase().trim()

  const timePattern = /([凌晨|早上|上午|中午|下午|傍晚|晚上|午夜|半夜])?\s*(\d{1,2})[点:：](\d{1,2})?[分]?/
  const match = lowerInput.match(timePattern)

  if (!match) return null

  const period = match[1]
  let hour = parseInt(match[2], 10)
  const minute = match[3] ? parseInt(match[3], 10) : 0

  if (period === "晚上" || period === "午夜" || period === "半夜") {
    if (hour !== 12) hour += 12
  } else if (period === "下午" || period === "傍晚") {
    if (hour !== 12) hour += 12
  } else if (period === "凌晨") {
    if (hour === 12) hour = 0
  }

  if (hour >= 24) hour = hour % 24

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

const sensorKeywordMap: Record<string, string> = {
  "烟雾": "烟雾",
  "报警": "烟雾",
  "下雨": "风雨",
  "风雨": "风雨",
  "开窗": "窗磁",
  "窗户": "窗磁",
  "门窗": "窗磁",
  "有人": "人体",
  "人动": "人体",
  "移动": "人体",
  "检测到人": "人体",
  "温度": "温湿度",
  "湿度": "温湿度",
}

export function fuzzyMatchDevice(input: string, deviceType: DeviceType): string | null {
  const deviceNames = defaultDeviceNames[deviceType] || []
  const lowerInput = input.toLowerCase()

  for (const name of deviceNames) {
    if (lowerInput.includes(name.toLowerCase())) {
      return name
    }
  }

  const words = deviceWords[deviceType] || []
  for (const word of words) {
    if (lowerInput.includes(word.toLowerCase())) {
      if (deviceType === "sensor") {
        const targetKeyword = sensorKeywordMap[word]
        if (targetKeyword) {
          const matchedDevice = deviceNames.find((name) => name.includes(targetKeyword))
          if (matchedDevice) {
            return matchedDevice
          }
        }
      }
      return deviceNames.length > 0 ? deviceNames[0] : null
    }
  }

  return null
}

export function parseNaturalLanguage(input: string): { templateId: string; extractedParams: Record<string, string> } | null {
  const lowerInput = input.toLowerCase().trim()
  if (!lowerInput) return null

  const extractedTime = extractTime(input)
  const extractedParams: Record<string, string> = {}
  
  if (extractedTime) {
    extractedParams.time = extractedTime
  }

  let bestTemplate: SceneTemplate | null = null
  let bestScore = 0

  defaultTemplates.forEach((template) => {
    let score = 0

    const positiveWords = ["开", "打开", "亮", "启动"]
    const negativeWords = ["关", "关闭", "灭", "停止"]

    const hasPositive = positiveWords.some((w) => lowerInput.includes(w))
    const hasNegative = negativeWords.some((w) => lowerInput.includes(w))

    const templateText = `${template.name} ${template.keywords.join(" ")}`.toLowerCase()
    const templateHasPositive = positiveWords.some((w) => templateText.includes(w))
    const templateHasNegative = negativeWords.some((w) => templateText.includes(w))

    if ((hasPositive && templateHasNegative) || (hasNegative && templateHasPositive)) {
      score -= 8
    }

    template.keywords.forEach((keyword, index) => {
      const lowerKeyword = keyword.toLowerCase()
      if (lowerInput.includes(lowerKeyword)) {
        if (index < 2) {
          score += 10
        } else {
          score += 5
        }
      }
    })

    if (lowerInput.includes(template.name.toLowerCase())) {
      score += 15
    }

    const templateNameWords = template.name.split(/\s+/).filter((w) => w.length >= 2)
    templateNameWords.forEach((word) => {
      if (lowerInput.includes(word.toLowerCase())) {
        score += 12
      }
    })

    if (lowerInput.includes(template.description.toLowerCase())) {
      score += 3
    }

    template.params.forEach((param) => {
      if (param.deviceType) {
        const words = deviceWords[param.deviceType] || []
        words.forEach((word) => {
          if (lowerInput.includes(word)) {
            score += 1
          }
        })

        const matchedDevice = fuzzyMatchDevice(input, param.deviceType)
        if (matchedDevice && !extractedParams[param.key]) {
          extractedParams[param.key] = matchedDevice
          score += 5
        }
      }
    })

    const hasTimeTrigger = template.triggers.some((t) => t.type === "timer")
    if (extractedTime && hasTimeTrigger) {
      const hour = parseInt(extractedTime.split(":")[0])
      const isMorning = hour >= 5 && hour < 12
      const isEvening = hour >= 18 || hour < 5

      const hasMorningKeyword = template.keywords.some((k) => ["早上", "早晨", "起床", "早安", "上午", "天亮", "日出"].includes(k))
      const hasEveningKeyword = template.keywords.some((k) => ["晚上", "夜间", "半夜", "晚安", "入睡", "起夜", "天黑", "夜里"].includes(k))

      const templateNameWords = template.name.split(/\s+/).filter((w) => w.length >= 2)
      const hasNameAnchor = templateNameWords.some((word) => lowerInput.includes(word.toLowerCase()))

      if ((isMorning && hasMorningKeyword) || (isEvening && hasEveningKeyword)) {
        score += 8
      } else if ((isMorning && hasEveningKeyword) || (isEvening && hasMorningKeyword)) {
        if (!hasNameAnchor) {
          score -= 5
        }
      } else {
        score += 3
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestTemplate = template
    }
  })

  if (!bestTemplate || bestScore < 5) {
    return null
  }

  const template = bestTemplate as SceneTemplate

  return {
    templateId: template.id,
    extractedParams,
  }
}

function replaceParams(str: string, params: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = params[key]
    return val !== undefined ? String(val) : `{{${key}}}`
  })
}

function replaceParamsInValue(value: unknown, params: Record<string, string>): unknown {
  if (typeof value === "string") {
    return replaceParams(value, params)
  }
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = replaceParamsInValue(val, params)
    }
    return result
  }
  return value
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function fillTemplate(templateId: string, params: Record<string, string>): SceneRule {
  const template = defaultTemplates.find((t) => t.id === templateId)
  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  const triggers: Trigger[] = template.triggers.map((t) => ({
    ...t,
    id: generateId(),
    entityId: replaceParams(t.entityId, params),
    value: replaceParamsInValue(t.value, params),
  }))

  const conditions: Condition[] | undefined = template.conditions?.map((c) => ({
    ...c,
    id: generateId(),
    entityId: replaceParams(c.entityId, params),
    value: replaceParamsInValue(c.value, params),
  }))

  const actions: Action[] = template.actions.map((a) => ({
    ...a,
    id: generateId(),
    entityId: replaceParams(a.entityId, params),
    value: replaceParamsInValue(a.value, params),
  }))

  const now = Date.now()

  return {
    id: generateId(),
    name: template.name,
    description: template.description,
    triggers,
    conditions,
    actions,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    platform: "tuya",
  }
}
