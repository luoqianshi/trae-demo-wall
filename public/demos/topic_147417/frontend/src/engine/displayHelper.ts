export function getTriggerDisplay(trigger: Record<string, unknown>): { icon: string; text: string } {
  const type = String(trigger.type)
  const entityId = String(trigger.entityId || "")
  const value = trigger.value
  const label = trigger.label ? String(trigger.label) : ""

  if (entityId.startsWith("{{") && entityId.endsWith("}}")) {
    const icon = type === "manual" ? "✨" : type === "timer" ? "🕐" : type === "device_status" ? "👣" : "📡"
    if (label) {
      return { icon, text: label }
    }
    const placeholderText = entityId.slice(2, -2)
    return { icon, text: placeholderText }
  }

  if (label) {
    const icon = type === "manual" ? "✨" : type === "timer" ? "🕐" : "👣"
    return { icon, text: label }
  }

  switch (type) {
    case "manual":
      return { icon: "✨", text: "手动触发" }
    case "timer":
      return { icon: "🕐", text: `定时触发 ${String(value)}` }
    case "time":
      const lowerEntityId = entityId.toLowerCase()
      if (lowerEntityId === "timer") {
        return { icon: "🕐", text: `定时 ${String(value)}` }
      }
      if (lowerEntityId === "sunrise_sunset" || entityId === "日出" || entityId === "日落") {
        if (entityId === "日出") return { icon: "🌅", text: "日出" }
        if (entityId === "日落") return { icon: "🌅", text: "日落" }
        return { icon: "🌅", text: value === "sunrise" ? "日出" : "日落" }
      }
      if (lowerEntityId === "cycle" || entityId === "周期定时器") {
        const valObj = value as Record<string, unknown>
        const interval = valObj.interval ?? 30
        const unit = valObj.unit ?? "minute"
        const unitText = unit === "minute" ? "分钟" : unit === "hour" ? "小时" : unit === "day" ? "天" : String(unit)
        return { icon: "🔄", text: `每${interval}${unitText}` }
      }
      return { icon: "🕐", text: `${entityId} ${String(value)}` }
    case "device_status":
      if (typeof value === "string") {
        if (value.toLowerCase() === "pir" || value.toLowerCase() === "motion") {
          return { icon: "👣", text: `检测到人移动` }
        }
        if (value.toLowerCase() === "open") {
          return { icon: "🚪", text: `检测到打开` }
        }
        if (value.toLowerCase() === "close") {
          return { icon: "🚪", text: `检测到关闭` }
        }
        if (value.toLowerCase() === "alarm") {
          return { icon: "🔔", text: `检测到告警` }
        }
        if (value.toLowerCase() === "rain") {
          return { icon: "🌧️", text: `检测到下雨` }
        }
      }
      if (typeof value === "object" && value !== null && entityId === "temp_humidity_sensor") {
        const valObj = value as Record<string, unknown>
        if ("temperature" in valObj) {
          const tempObj = valObj.temperature as Record<string, unknown>
          if ("gt" in tempObj) {
            return { icon: "🌡️", text: `温度 > ${tempObj.gt}℃` }
          }
          if ("lt" in tempObj) {
            return { icon: "🌡️", text: `温度 < ${tempObj.lt}℃` }
          }
        }
        if ("humidity" in valObj) {
          const humObj = valObj.humidity as Record<string, unknown>
          if ("gt" in humObj) {
            return { icon: "💧", text: `湿度 > ${humObj.gt}%` }
          }
          if ("lt" in humObj) {
            return { icon: "💧", text: `湿度 < ${humObj.lt}%` }
          }
        }
      }
      if (typeof value === "object" && value !== null && entityId === "light_sensor") {
        const valObj = value as Record<string, unknown>
        if ("illuminance" in valObj) {
          const illObj = valObj.illuminance as Record<string, unknown>
          if ("gt" in illObj) {
            return { icon: "☀️", text: `光照 > ${illObj.gt}lux` }
          }
          if ("lt" in illObj) {
            return { icon: "🌙", text: `光照 < ${illObj.lt}lux` }
          }
        }
      }
      return { icon: "📡", text: `状态变化` }
    default:
      return { icon: "🔹", text: `状态变化` }
  }
}

export function getActionDisplay(action: Record<string, unknown>): { icon: string; text: string; deviceName: string } {
  const type = String(action.type)
  const entityId = String(action.entityId || "")
  const value = action.value
  const label = action.label ? String(action.label) : ""

  if (entityId.startsWith("{{") && entityId.endsWith("}}")) {
    const icon = type === "device_control" ? "💡" : type === "delay" ? "⏱️" : type === "notification" ? "🔔" : "▶️"
    if (label) {
      return { icon, text: label, deviceName: "" }
    }
    const placeholderText = entityId.slice(2, -2)
    return { icon, text: placeholderText, deviceName: "" }
  }

  if (label) {
    const icon = type === "device_control" ? "💡" : type === "delay" ? "⏱️" : type === "notification" ? "🔔" : "▶️"
    return { icon, text: label, deviceName: entityId }
  }

  switch (type) {
    case "device_control":
      if (typeof value === "object" && value !== null) {
        const valObj = value as Record<string, unknown>
        if ("mode" in valObj && "temperature" in valObj) {
          const mode = String(valObj.mode)
          const modeText = mode === "cool" ? "制冷" : mode === "heat" ? "制热" : mode === "auto" ? "自动" : mode
          return {
            icon: "❄️",
            text: `${entityId} ${modeText} ${valObj.temperature}°C`,
            deviceName: entityId,
          }
        }
        if ("switch" in valObj) {
          const speed = "speed" in valObj ? ` ${speedText(String(valObj.speed))}` : ""
          const onText = entityId === "light" ? (valObj.switch ? "开启" : "熄灭") : (valObj.switch ? "开启" : "关闭")
          return {
            icon: "💡",
            text: `${entityId} ${onText}${speed}`,
            deviceName: entityId,
          }
        }
        if ("control" in valObj) {
          const controlVal = String(valObj.control)
          return {
            icon: "🪟",
            text: `${entityId} ${controlVal === "open" ? "开启" : "关闭"}`,
            deviceName: entityId,
          }
        }
        if ("lock" in valObj) {
          return {
            icon: "🔒",
            text: `${entityId} ${valObj.lock ? "上锁" : "解锁"}`,
            deviceName: entityId,
          }
        }
        if ("play" in valObj) {
          return {
            icon: "🔊",
            text: `${entityId} 播放`,
            deviceName: entityId,
          }
        }
        if ("feed" in valObj) {
          return {
            icon: "🍖",
            text: `${entityId} 启动喂食`,
            deviceName: entityId,
          }
        }
        if ("start" in valObj) {
          return {
            icon: "🤖",
            text: `${entityId} 开始清扫`,
            deviceName: entityId,
          }
        }
        if ("temp" in valObj) {
          return {
            icon: "🌡️",
            text: `${entityId} 温度 ${valObj.temp}℃`,
            deviceName: entityId,
          }
        }
      }
      return {
        icon: "⚙️",
        text: `${entityId}`,
        deviceName: entityId,
      }
    case "delay": {
      const seconds = Number(value) || 0
      const minutes = Math.floor(seconds / 60)
      if (minutes > 0) {
        return {
          icon: "⏳",
          text: `等待 ${minutes} 分钟（${seconds} 秒）`,
          deviceName: "",
        }
      }
      return {
        icon: "⏳",
        text: `等待 ${seconds} 秒`,
        deviceName: "",
      }
    }
    case "notification":
      return {
        icon: "🔔",
        text: `推送通知`,
        deviceName: "",
      }
    default:
      return {
        icon: "▶️",
        text: `${entityId} → 执行`,
        deviceName: entityId,
      }
  }
}

export function getConditionDisplay(condition: Record<string, unknown>): { icon: string; text: string } {
  const entityId = String(condition.entityId || "")
  const operator = String(condition.operator || "")
  const value = condition.value
  const label = condition.label ? String(condition.label) : ""

  if (label) {
    return { icon: "📋", text: label }
  }

  if (entityId.startsWith("{{") && entityId.endsWith("}}")) {
    return { icon: "📋", text: label || entityId.slice(2, -2) }
  }

  let valueText = String(value)

  const operatorMap: Record<string, string> = {
    "==": "等于",
    "!=": "不等于",
    ">": "大于",
    "<": "小于",
    ">=": "大于等于",
    "<=": "小于等于",
    "in": "在",
  }
  const friendlyOperator = operatorMap[operator] || operator

  if (typeof value === "string") {
    const valueFriendlyMap: Record<string, string> = {
      "open": "打开",
      "close": "关闭",
      "pir": "检测到人",
      "motion": "检测到移动",
      "alarm": "报警",
      "rain": "下雨",
      "no_person": "无人",
    }
    valueText = valueFriendlyMap[value.toLowerCase()] || String(value)
  }

  return { icon: "📋", text: `${entityId} ${friendlyOperator} ${valueText}` }
}

function speedText(speed: string): string {
  switch (speed) {
    case "low":
      return "低速"
    case "medium":
      return "中速"
    case "high":
      return "高速"
    default:
      return speed
  }
}
