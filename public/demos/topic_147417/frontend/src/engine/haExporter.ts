import type { SceneRule, Trigger, Action } from "./types"

const KNOWN_DEVICE_TYPES = new Set([
  "light", "switch", "ac", "curtain", "lock", "fan",
  "tv", "speaker", "camera", "heater", "purifier", "robot",
])

const DEVICE_DOMAIN_MAP: Record<string, string> = {
  light: "light",
  switch: "switch",
  ac: "climate",
  curtain: "cover",
  lock: "lock",
  fan: "fan",
  tv: "media_player",
  speaker: "media_player",
  camera: "camera",
  heater: "climate",
  purifier: "fan",
  robot: "vacuum",
}

function inferDeviceType(entityId: string, value: unknown): string {
  const lowerEntityId = entityId.toLowerCase()
  if (KNOWN_DEVICE_TYPES.has(lowerEntityId)) {
    return lowerEntityId
  }

  if (typeof value === "object" && value !== null) {
    const valObj = value as Record<string, unknown>
    if ("mode" in valObj && "temperature" in valObj) return "ac"
    if ("control" in valObj) return "curtain"
    if ("lock" in valObj) return "lock"
    if ("start" in valObj) return "robot"
    if ("speed" in valObj && "switch" in valObj) return "fan"
  }

  if (lowerEntityId.includes("灯") || lowerEntityId.includes("light")) return "light"
  if (lowerEntityId.includes("插座") || lowerEntityId.includes("socket")) return "switch"
  if (lowerEntityId.includes("空调") || lowerEntityId.includes("ac")) return "ac"
  if (lowerEntityId.includes("窗帘") || lowerEntityId.includes("curtain")) return "curtain"
  if (lowerEntityId.includes("门锁") || lowerEntityId.includes("锁") || lowerEntityId.includes("lock")) return "lock"
  if (lowerEntityId.includes("风扇") || lowerEntityId.includes("fan")) return "fan"
  if (lowerEntityId.includes("电视") || lowerEntityId.includes("tv")) return "tv"
  if (lowerEntityId.includes("音箱") || lowerEntityId.includes("音响") || lowerEntityId.includes("speaker")) return "speaker"
  if (lowerEntityId.includes("摄像头") || lowerEntityId.includes("camera")) return "camera"
  if (lowerEntityId.includes("净化器") || lowerEntityId.includes("purifier")) return "purifier"
  if (lowerEntityId.includes("取暖") || lowerEntityId.includes("加热") || lowerEntityId.includes("heater")) return "heater"
  if (lowerEntityId.includes("扫地") || lowerEntityId.includes("机器人") || lowerEntityId.includes("robot")) return "robot"

  return "light"
}

function getDomain(deviceType: string): string {
  return DEVICE_DOMAIN_MAP[deviceType] || "light"
}

function formatTimeValue(time: string): string {
  const parts = time.split(":")
  if (parts.length === 2) return `${time}:00`
  return time
}

function generateTriggerYAML(trigger: Trigger): string[] {
  const { type, entityId, value, operator, label } = trigger

  if (type === "manual") {
    return [
      "  - platform: event",
      "    event_type: manual_trigger",
    ]
  }

  if (type === "timer") {
    const timeStr = String(value)
    if (timeStr.includes("-")) {
      return [
        "  - platform: event",
        '    event_type: timer_range_trigger',
      ]
    }
    return [
      "  - platform: time",
      `    at: "${formatTimeValue(timeStr)}"`,
    ]
  }

  if (type === "time") {
    const lowerEntityId = entityId.toLowerCase()

    if (lowerEntityId === "timer") {
      return [
        "  - platform: time",
        `    at: "${formatTimeValue(String(value))}"`,
      ]
    }

    if (lowerEntityId === "sunrise_sunset" || entityId === "日出" || entityId === "日落") {
      const event = String(value).toLowerCase() === "sunrise" ? "sunrise" : "sunset"
      return [
        "  - platform: sun",
        `    event: ${event}`,
      ]
    }

    if (lowerEntityId === "cycle" || entityId === "周期定时器") {
      if (typeof value === "object" && value !== null) {
        const valObj = value as Record<string, unknown>
        const interval = Number(valObj.interval ?? 30)
        const unit = String(valObj.unit ?? "minute")
        const field = unit === "hour" ? "hours" : unit === "day" ? "days" : "minutes"
        return [
          "  - platform: time_pattern",
          `    ${field}: "/${interval}"`,
        ]
      }
    }
  }

  if (type === "device_status") {
    const lowerEntityId = entityId.toLowerCase()
    const valStr = typeof value === "string" ? value.toLowerCase() : ""
    const labelStr = (label || "").toLowerCase()

    if (lowerEntityId === "motion_sensor" || valStr === "motion" || valStr === "pir" ||
        (labelStr.includes("人体") || labelStr.includes("移动") || labelStr.includes("motion"))) {
      const to = valStr === "no_person" || valStr === "no motion" ? "off" : "on"
      return [
        "  - platform: state",
        "    entity_id: binary_sensor.motion_sensor",
        `    to: "${to}"`,
      ]
    }

    if (lowerEntityId === "contact_sensor" || labelStr.includes("门") || labelStr.includes("窗")) {
      const to = valStr === "close" || valStr === "closed" ? "off" : "on"
      return [
        "  - platform: state",
        "    entity_id: binary_sensor.door_sensor",
        `    to: "${to}"`,
      ]
    }

    if (lowerEntityId === "smoke_sensor" || valStr === "alarm" || labelStr.includes("烟雾") || labelStr.includes("smoke")) {
      return [
        "  - platform: state",
        "    entity_id: binary_sensor.smoke_sensor",
        '    to: "on"',
      ]
    }

    if (lowerEntityId === "temp_humidity_sensor" && typeof value === "object" && value !== null) {
      const valObj = value as Record<string, unknown>
      if ("temperature" in valObj) {
        const tempObj = valObj.temperature as Record<string, unknown>
        if ("gt" in tempObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.temperature",
            `    above: "${tempObj.gt}"`,
          ]
        }
        if ("lt" in tempObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.temperature",
            `    below: "${tempObj.lt}"`,
          ]
        }
      }
      if ("humidity" in valObj) {
        const humObj = valObj.humidity as Record<string, unknown>
        if ("gt" in humObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.humidity",
            `    above: "${humObj.gt}"`,
          ]
        }
        if ("lt" in humObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.humidity",
            `    below: "${humObj.lt}"`,
          ]
        }
      }
    }

    if (lowerEntityId === "light_sensor" && typeof value === "object" && value !== null) {
      const valObj = value as Record<string, unknown>
      if ("illuminance" in valObj) {
        const illObj = valObj.illuminance as Record<string, unknown>
        if ("gt" in illObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.illuminance",
            `    above: "${illObj.gt}"`,
          ]
        }
        if ("lt" in illObj) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.illuminance",
            `    below: "${illObj.lt}"`,
          ]
        }
      }
    }

    if (typeof value !== "object" && operator) {
      const threshold = Number(value)
      if (!isNaN(threshold)) {
        const op = operator === ">" ? "above" : operator === "<" ? "below" : ""
        if (op && (labelStr.includes("温度") || labelStr.includes("temp"))) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.temperature",
            `    ${op}: "${threshold}"`,
          ]
        }
        if (op && (labelStr.includes("湿度") || labelStr.includes("humidity"))) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.humidity",
            `    ${op}: "${threshold}"`,
          ]
        }
        if (op && (labelStr.includes("光") || labelStr.includes("illuminance"))) {
          return [
            "  - platform: numeric_state",
            "    entity_id: sensor.illuminance",
            `    ${op}: "${threshold}"`,
          ]
        }
      }
    }

    if (valStr === "rain" || labelStr.includes("雨")) {
      return [
        "  - platform: state",
        "    entity_id: binary_sensor.rain_sensor",
        '    to: "on"',
      ]
    }
  }

  return [
    "  - platform: event",
    "    event_type: unknown_trigger",
  ]
}

function generateActionYAML(
  action: Action,
  getOrCreateEntityId: (name: string, deviceType: string) => string
): string[] {
  const { type, entityId, value } = action

  if (type === "delay") {
    const seconds = Number(value) || 0
    return [`  - delay: ${seconds}`]
  }

  if (type === "notification") {
    const message = String(value || "").replace(/"/g, '\\"')
    return [
      "  - service: notify.notify",
      "    data:",
      `      message: "${message}"`,
    ]
  }

  if (type === "device_control") {
    const deviceType = inferDeviceType(entityId, value)
    const haEntityId = getOrCreateEntityId(entityId, deviceType)

    if (typeof value !== "object" || value === null) {
      return [
        "  - service: homeassistant.turn_on",
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    const valObj = value as Record<string, unknown>

    if (deviceType === "ac") {
      if ("switch" in valObj && valObj.switch === false) {
        return [
          "  - service: climate.turn_off",
          "    target:",
          `      entity_id: ${haEntityId}`,
        ]
      }
      const mode = String(valObj.mode || "cool")
      const temp = Number(valObj.temperature) || 26
      return [
        "  - service: climate.set_temperature",
        "    target:",
        `      entity_id: ${haEntityId}`,
        "    data:",
        `      temperature: ${temp}`,
        `      hvac_mode: ${mode}`,
      ]
    }

    if (deviceType === "curtain") {
      const control = String(valObj.control || "open")
      const service = control === "open" ? "cover.open_cover" : "cover.close_cover"
      return [
        `  - service: ${service}`,
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    if (deviceType === "lock") {
      const shouldLock = valObj.lock !== false
      const service = shouldLock ? "lock.lock" : "lock.unlock"
      return [
        `  - service: ${service}`,
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    if (deviceType === "fan") {
      if ("switch" in valObj && valObj.switch === false) {
        return [
          "  - service: fan.turn_off",
          "    target:",
          `      entity_id: ${haEntityId}`,
        ]
      }
      const speed = "speed" in valObj ? String(valObj.speed) : ""
      if (speed) {
        return [
          "  - service: fan.turn_on",
          "    target:",
          `      entity_id: ${haEntityId}`,
          "    data:",
          `      speed: ${speed}`,
        ]
      }
      return [
        "  - service: fan.turn_on",
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    if (deviceType === "robot") {
      if ("switch" in valObj && valObj.switch === false) {
        return [
          "  - service: vacuum.turn_off",
          "    target:",
          `      entity_id: ${haEntityId}`,
        ]
      }
      return [
        "  - service: vacuum.start",
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    if (deviceType === "camera") {
      const shouldTurnOn = valObj.switch !== false
      const service = shouldTurnOn ? "camera.turn_on" : "camera.turn_off"
      return [
        `  - service: ${service}`,
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    if ("switch" in valObj) {
      const service = valObj.switch === true ? "homeassistant.turn_on" : "homeassistant.turn_off"
      return [
        `  - service: ${service}`,
        "    target:",
        `      entity_id: ${haEntityId}`,
      ]
    }

    return [
      "  - service: homeassistant.turn_on",
      "    target:",
      `      entity_id: ${haEntityId}`,
    ]
  }

  return ["  - service: homeassistant.turn_on"]
}

export function generateHAYAML(rule: SceneRule): string {
  const entityMappings: Array<{ originalName: string; entityId: string }> = []
  const entityMap = new Map<string, string>()
  let deviceCounter = 0

  const getOrCreateEntityId = (deviceName: string, deviceType: string): string => {
    if (entityMap.has(deviceName)) {
      return entityMap.get(deviceName)!
    }
    deviceCounter++
    const domain = getDomain(deviceType)
    const entityId = `${domain}.device_${deviceCounter}`
    entityMap.set(deviceName, entityId)
    entityMappings.push({ originalName: deviceName, entityId })
    return entityId
  }

  const triggerYAMLs = rule.triggers.flatMap((t) => generateTriggerYAML(t))
  const actionYAMLs = rule.actions
    .map((a) => generateActionYAML(a, getOrCreateEntityId))
    .flat()

  const lines: string[] = []

  if (entityMappings.length > 0) {
    lines.push("# 请将以下 entity_id 替换为你的 HA 实体：")
    entityMappings.forEach(({ originalName, entityId }) => {
      lines.push(`# ${originalName} → ${entityId}`)
    })
    lines.push("")
  }

  lines.push(`- alias: "${rule.name}"`)
  lines.push(`  mode: single`)

  if (rule.description) {
    lines.push(`  description: "${rule.description.replace(/"/g, '\\"')}"`)
  }

  lines.push(`  trigger:`)
  if (triggerYAMLs.length === 0) {
    lines.push("  - platform: event")
    lines.push("    event_type: manual_trigger")
  } else {
    lines.push(...triggerYAMLs)
  }

  if (rule.conditions && rule.conditions.length > 0) {
    lines.push(`  condition:`)
    lines.push("  - condition: state")
    lines.push("    entity_id: binary_sensor.placeholder")
    lines.push('    state: "on"')
  }

  lines.push(`  action:`)
  if (actionYAMLs.length === 0) {
    lines.push("  - service: homeassistant.turn_on")
  } else {
    lines.push(...actionYAMLs)
  }

  return lines.join("\n")
}
