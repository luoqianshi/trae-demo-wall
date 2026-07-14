import type { SceneRule, Trigger, Action } from "./types"
import type { AIProvider, ModelConfig } from "@/config/aiModels"
import type { Device } from "./types"
import { getAIConfig } from "@/stores/useAIConfigStore"

interface AIGeneratedRule {
  name: string
  triggers: Array<{ type: string; entityId: string; value: unknown }>
  actions: Array<{ type: string; entityId: string; value: unknown }>
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createTrigger(data: { type: string; entityId: string; value: unknown }): Trigger {
  return {
    id: generateId(),
    type: data.type,
    entityId: data.entityId,
    value: data.value,
  }
}

function createAction(data: { type: string; entityId: string; value: unknown }): Action {
  return {
    id: generateId(),
    type: data.type,
    entityId: data.entityId,
    value: data.value,
  }
}

const categoryChinese: Record<string, string> = {
  light: "照明",
  switch: "插座",
  ac: "空调",
  curtain: "窗帘",
  fan: "风扇",
  tv: "电视",
  speaker: "音箱",
  lock: "门锁",
  heater: "取暖器",
  purifier: "净化器",
  robot: "扫地机器人",
  camera: "摄像头",
  sensor: "传感器",
}

function buildDevicePrompt(devices: Device[]): string {
  if (devices.length === 0) return ""

  const deviceList = devices.map((d) => {
    const cat = categoryChinese[d.category] || d.category
    return `- ${d.name}（${cat}，entityId: ${d.type}）`
  }).join("\n")

  const applianceDevices = devices.filter((d) => 
    ["light", "switch", "ac", "curtain", "fan", "tv", "speaker", "heater", "purifier", "robot", "camera"].includes(d.type)
  )
  const applianceIds = applianceDevices.map((d) => d.type).join(", ")

  return `

# 用户已连接真实设备（必须严格使用以下设备生成规则）
${deviceList}

# 重要约束
- 只允许使用上述列表中的设备类型作为 action 的 entityId
- "所有电器"/"全部设备" 只包含当前已连接的电器，不包含传感器
- 当前电器列表（entityId）：${applianceIds}
- 如果用户提到的设备不在列表中，忽略该设备或使用最接近的设备类型
`
}

function buildRequestBody(model: string, userInput: string, devices?: Device[]): unknown {
  const devicePrompt = buildDevicePrompt(devices || [])

  const systemPrompt = `# 角色
你是智能家居场景规则解析引擎，将用户自然语言转换为标准化 JSON 规则。输出直接用于涂鸦/米家平台自动化配置，必须精确无误。

# 输出格式
仅输出一行 JSON，禁止包含 markdown 标记、注释、解释文字或换行。
结构：{"name":"场景名","triggers":[{"type":"触发类型","entityId":"标识","value":值}],"actions":[{"type":"device_control","entityId":"标识","value":值}]}

# 字段约束
- name：字符串，简洁中文场景名（4-10字）
- triggers：数组，至少1个；多个 trigger 之间为"且"关系
- actions：数组，至少1个
- trigger.type 只能是：device_status / time / manual
- action.type 固定为：device_control

# 传感器标识表（仅用于 trigger，type=device_status）
| entityId | 说明 | value 格式 |
|---|---|---|
| motion_sensor | 人体移动 | "motion" |
| contact_sensor | 门窗磁 | "open" 或 "close" |
| smoke_sensor | 烟雾 | "alarm" |
| temp_humidity_sensor | 温湿度 | {"temperature":{"gt":30}} 或 {"humidity":{"gt":70}} |
| light_sensor | 光照 | {"illuminance":{"lt":50}} |
| leak_sensor | 水浸 | "alarm" |
注：gt=大于，lt=小于

# 家电标识表（仅用于 action，type=device_control）
| entityId | 说明 | value 格式 |
|---|---|---|
| light | 灯 | {"switch":true/false} |
| switch | 插座/开关 | {"switch":true/false} |
| ac | 空调（仅制冷/制热/调温） | {"mode":"cool","temperature":26} 或 {"switch":false} |
| curtain | 窗帘 | {"control":"open"/"close"} |
| fan | 风扇 | {"switch":true,"speed":"medium"} 或 {"switch":false} |
| tv | 电视 | {"switch":true/false} |
| speaker | 音箱 | {"switch":true/false} |
| lock | 门锁 | {"lock":true/false}（true=锁定，false=解锁） |
| heater | 取暖器 | {"switch":true/false} |
| purifier | 净化器（除湿/净化空气） | {"switch":true/false} |
| robot | 扫地机器人 | {"start":true} 或 {"switch":false} |
| camera | 摄像头 | {"switch":true/false} |

# 时间触发表（type=time）
| 场景 | entityId | value 格式 |
|---|---|---|
| 定时 | timer | "HH:MM"（如"22:00"） |
| 日出 | sunrise_sunset | "sunrise" |
| 日落 | sunrise_sunset | "sunset" |
| 周期 | cycle | {"interval":30,"unit":"minute"} |

# 手动触发（type=manual）
entityId: "scene_button", value: "manual_trigger"

# 设备语义映射（严格遵守，违反则规则错误）
"除湿"/"除湿模式"/"抽湿" → purifier（净化器），禁止用 ac
"净化空气"/"除甲醛" → purifier
"制冷"/"降温"/"冷气" → ac
"制热"/"取暖"/"暖气" → heater
"扫地"/"打扫"/"清洁" → robot
"通风"/"换气"/"排风" → fan
"照明"/"开灯"/"关灯" → light

# 复合场景规则
1. 日出+日落双向（如"日出开窗帘日落关窗帘"）：必须返回2个 trigger（value 分别为 "sunrise" 和 "sunset"）+ 2个对应 action（open 和 close），禁止合并为1个 trigger
2. 周期+条件（如"每30分钟检测温度>28度开空调"）：返回2个 trigger（cycle + device_status）+ 1个 action
3. 定时+传感器（如"晚上10点有人移动时开灯"）：返回2个 trigger（timer + device_status）+ 1个 action
4. 单触发多动作（如"开灯并打开空调"）：返回1个 trigger + 多个 action
5. 全部电器（"所有电器"/"全部设备"）：actions 必须包含当前已连接的所有电器类型，不可遗漏
6. 关闭全部电器：每个 action 的 value 必须为 {"switch":false}

# Few-shot 示例

用户：有人移动时打开客厅灯
{"name":"有人移动开灯","triggers":[{"type":"device_status","entityId":"motion_sensor","value":"motion"}],"actions":[{"type":"device_control","entityId":"light","value":{"switch":true}}]}

用户：晚上10点把空调调到26度
{"name":"夜间空调","triggers":[{"type":"time","entityId":"timer","value":"22:00"}],"actions":[{"type":"device_control","entityId":"ac","value":{"mode":"cool","temperature":26}}]}

用户：温度高于30度时打开风扇
{"name":"高温开风扇","triggers":[{"type":"device_status","entityId":"temp_humidity_sensor","value":{"temperature":{"gt":30}}}],"actions":[{"type":"device_control","entityId":"fan","value":{"switch":true,"speed":"medium"}}]}

用户：烟雾告警时打开所有灯并解锁大门
{"name":"烟雾报警应急","triggers":[{"type":"device_status","entityId":"smoke_sensor","value":"alarm"}],"actions":[{"type":"device_control","entityId":"light","value":{"switch":true}},{"type":"device_control","entityId":"lock","value":{"lock":false}}]}

用户：湿度超过70%时开启除湿模式
{"name":"高湿除湿","triggers":[{"type":"device_status","entityId":"temp_humidity_sensor","value":{"humidity":{"gt":70}}}],"actions":[{"type":"device_control","entityId":"purifier","value":{"switch":true}}]}

用户：窗帘在日出时打开，日落时关闭
{"name":"日出开窗帘日落关窗帘","triggers":[{"type":"time","entityId":"sunrise_sunset","value":"sunrise"},{"type":"time","entityId":"sunrise_sunset","value":"sunset"}],"actions":[{"type":"device_control","entityId":"curtain","value":{"control":"open"}},{"type":"device_control","entityId":"curtain","value":{"control":"close"}}]}

用户：每30分钟检测温度超过28度开空调
{"name":"周期检测高温开空调","triggers":[{"type":"time","entityId":"cycle","value":{"interval":30,"unit":"minute"}},{"type":"device_status","entityId":"temp_humidity_sensor","value":{"temperature":{"gt":28}}}],"actions":[{"type":"device_control","entityId":"ac","value":{"mode":"cool","temperature":26}}]}

用户：晚上10点有人移动时开灯
{"name":"夜间有人移动开灯","triggers":[{"type":"time","entityId":"timer","value":"22:00"},{"type":"device_control","entityId":"motion_sensor","value":"motion"}],"actions":[{"type":"device_control","entityId":"light","value":{"switch":true}}]}

用户：门窗打开时触发警报
{"name":"门窗防盗报警","triggers":[{"type":"device_status","entityId":"contact_sensor","value":"open"}],"actions":[{"type":"device_control","entityId":"speaker","value":{"switch":true}}]}

用户：离家模式关闭所有电器
{"name":"离家模式","triggers":[{"type":"manual","entityId":"scene_button","value":"manual_trigger"}],"actions":[{"type":"device_control","entityId":"light","value":{"switch":false}},{"type":"device_control","entityId":"ac","value":{"switch":false}},{"type":"device_control","entityId":"curtain","value":{"switch":false}},{"type":"device_control","entityId":"fan","value":{"switch":false}},{"type":"device_control","entityId":"tv","value":{"switch":false}},{"type":"device_control","entityId":"speaker","value":{"switch":false}},{"type":"device_control","entityId":"heater","value":{"switch":false}},{"type":"device_control","entityId":"purifier","value":{"switch":false}},{"type":"device_control","entityId":"robot","value":{"switch":false}},{"type":"device_control","entityId":"switch","value":{"switch":false}}]}

${devicePrompt}

# 输出约束
1. 只输出一行 JSON，无 markdown、无注释、无换行、无前后缀文字
2. JSON 必须可被 JSON.parse 直接解析
3. 所有字符串使用双引号
4. 禁止输出 json 或反引号标记`

  return {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `用户输入：${userInput}` },
    ],
  }
}

function extractResponse(response: unknown): string | null {
  const obj = response as Record<string, unknown>
  const choices = obj.choices as Array<{ message?: { content?: string } }>
  return choices?.[0]?.message?.content || null
}

export async function generateRuleByAI(
  userInput: string,
  config?: Partial<ModelConfig>,
  devices?: Device[]
): Promise<SceneRule | null> {
  const defaultConfig = getAIConfig()
  const resolvedConfig = {
    ...{
      provider: "aliyun" as AIProvider,
      apiKey: "",
      model: "qwen-plus",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
    ...defaultConfig,
    ...config,
  }
  const { apiKey, model, baseUrl } = resolvedConfig

  if (!apiKey) {
    throw new Error("未配置 AI API Key")
  }

  if (!baseUrl) {
    throw new Error("未配置 Base URL")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  }

  const body = buildRequestBody(model, userInput, devices)
  const endpoint = `${baseUrl}/chat/completions`

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`API 请求失败: ${errorBody.message || response.status}`)
    }

    const data = await response.json()
    const content = extractResponse(data)

    if (!content) {
      throw new Error("模型未返回有效内容")
    }

    let cleanedContent = content.trim()
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.slice(7)
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.slice(3)
    }
    if (cleanedContent.endsWith("```")) {
      cleanedContent = cleanedContent.slice(0, -3)
    }
    const jsonStart = cleanedContent.indexOf("{")
    const jsonEnd = cleanedContent.lastIndexOf("}")
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedContent = cleanedContent.slice(jsonStart, jsonEnd + 1)
    }

    const parsed: AIGeneratedRule = JSON.parse(cleanedContent)

    const sceneRule: SceneRule = {
      id: generateId(),
      name: parsed.name,
      triggers: parsed.triggers.map(createTrigger),
      actions: parsed.actions.map(createAction),
      conditions: [],
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      platform: "tuya",
    }

    return sceneRule
  } catch (error) {
    console.error("AI 生成规则失败:", error)
    throw error
  }
}