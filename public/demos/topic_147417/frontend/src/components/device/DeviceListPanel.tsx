import { useState, useCallback, useEffect, useRef } from "react"
import { useAppStore } from "@/stores/useAppStore"
import { usePlatformConfigStore } from "@/stores/usePlatformConfigStore"
import { sendDeviceCommand, rgbToTuyaColor, getDeviceSpecification, type TuyaDeviceSpecification, type TuyaDeviceFunction } from "@/platforms/tuyaApi"
import { toast } from "sonner"
import {
  Wifi,
  Power,
  Lightbulb,
  ThermometerSun,
  Plug,
  Bell,
  Layers,
  Monitor,
  Flame,
  Camera,
  Lock,
  Radio,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  CloudSun,
} from "lucide-react"

const categoryIcons: Record<string, typeof Lightbulb> = {
  light: Lightbulb,
  ac: ThermometerSun,
  switch: Plug,
  sensor: Bell,
  curtain: Layers,
  fan: Radio,
  tv: Monitor,
  speaker: Radio,
  lock: Lock,
  camera: Camera,
  heater: Flame,
  purifier: Radio,
  robot: Monitor,
}

const categoryChinese: Record<string, string> = {
  light: "照明",
  ac: "空调",
  switch: "插座",
  sensor: "传感器",
  curtain: "窗帘",
  fan: "风扇",
  tv: "电视",
  speaker: "音箱",
  lock: "门锁",
  camera: "摄像头",
  heater: "取暖器",
  purifier: "净化器",
  robot: "扫地机器人",
}

const categoryEnglish: Record<string, string> = {
  light: "Lighting",
  ac: "Air Conditioner",
  switch: "Switch",
  sensor: "Sensor",
  curtain: "Curtain",
  fan: "Fan",
  tv: "TV",
  speaker: "Speaker",
  lock: "Smart Lock",
  camera: "Camera",
  heater: "Heater",
  purifier: "Purifier",
  robot: "Robot Cleaner",
}

const sceneColors = [
  { name: "暖阳阅读", emoji: "📖", hex: "#FFD580", brightness: 800, bg: "bg-amber-50", activeBg: "bg-amber-100" },
  { name: "深夜影院", emoji: "🎬", hex: "#FFB347", brightness: 200, bg: "bg-purple-50", activeBg: "bg-purple-100" },
  { name: "林中清晨", emoji: "🌿", hex: "#C5E99B", brightness: 600, bg: "bg-green-50", activeBg: "bg-green-100" },
  { name: "海边落日", emoji: "🌅", hex: "#FF9A76", brightness: 700, bg: "bg-orange-50", activeBg: "bg-orange-100" },
  { name: "极光之夜", emoji: "🌌", hex: "#7B68EE", brightness: 500, bg: "bg-indigo-50", activeBg: "bg-indigo-100" },
  { name: "专注工作", emoji: "💡", hex: "#F5F5F5", brightness: 900, bg: "bg-slate-50", activeBg: "bg-slate-100" },
  { name: "浪漫晚餐", emoji: "🕯️", hex: "#FF6F61", brightness: 300, bg: "bg-rose-50", activeBg: "bg-rose-100" },
  { name: "星空入眠", emoji: "🌙", hex: "#B8C5D6", brightness: 150, bg: "bg-sky-50", activeBg: "bg-sky-100" },
]

const presetColorCircles = [
  { name: "暖白", hex: "#FFD580" },
  { name: "冷白", hex: "#F5F5F5" },
  { name: "红", hex: "#FF6B6B" },
  { name: "绿", hex: "#51CF66" },
  { name: "蓝", hex: "#339AF0" },
  { name: "紫", hex: "#9775FA" },
]

const dpCodeChinese: Record<string, string> = {
  music_rhythm_enable: "音乐律动",
  music_rhythm_mode: "律动模式",
  music_rhythm_sensitivity: "律动灵敏度",
  power_on_reaction: "通电反应",
  scene_mode: "场景模式",
  countdown: "倒计时",
  timer: "定时",
  night_light: "夜灯模式",
  anti_flicker: "防频闪",
  smooth_switch: "渐变开关",
  wake_up_light: "唤醒灯",
  sleep_light: "助眠灯",
  color_temp: "色温",
  light_mode: "灯光模式",
  speed: "风速",
  shake: "摇头",
  swing: "摆风",
  humidity: "湿度",
  pm25: "PM2.5",
  mode: "模式",
}

const standardDpCodes = new Set([
  "switch_led", "switch", "switch_1",
  "bright_value", "brightness",
  "colour_data", "color",
  "work_mode",
  "temp_value", "temp_value_v2", "color_temp",
  "control",
  "mode", "temp_set",
])

function getSwitchDpCode(deviceType?: string): string {
  if (deviceType === "light") return "switch_led"
  if (deviceType === "fan") return "switch"
  return "switch_1"
}

function getDeviceDisplayName(device: { name: string; category: string }): string {
  if (/[\u4e00-\u9fa5]/.test(device.name)) {
    return device.name
  }
  const catText = categoryChinese[device.category] || device.category
  return `${device.name}（${catText}）`
}

function getDpCodeLabel(code: string): string {
  return dpCodeChinese[code] || code
}

function generateControlUI(
  func: TuyaDeviceFunction,
  currentValue: unknown,
  inputValues: Record<string, string>,
  setInputValue: (code: string, value: string) => void,
  onValueChange: (value: unknown) => void,
  isLoading: boolean
) {
  const { code, type, values } = func
  const label = getDpCodeLabel(code)

  if (!dpCodeChinese[code]) return null

  if (code === "countdown" && type === "Integer") {
    const max = values?.max ? Number(values.max) : 86400
    const currentSeconds = Number(currentValue) || 0
    const currentMinutes = Math.round(currentSeconds / 60)
    const maxMinutes = Math.min(Math.round(max / 60), 1440)
    return (
      <div key={code} className="py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">{label}</span>
          <span className="text-sm text-muted-foreground">
            {currentMinutes > 0 ? `${currentMinutes} 分钟` : "已关闭"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxMinutes}
          value={currentMinutes}
          onChange={(e) => onValueChange(Number(e.target.value) * 60)}
          className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer"
          disabled={isLoading}
        />
      </div>
    )
  }

  if (type === "Boolean") {
    const boolValue = Boolean(currentValue)
    return (
      <div key={code} className="flex items-center justify-between py-2">
        <span className="text-sm">{label}</span>
        <button
          onClick={() => onValueChange(!boolValue)}
          disabled={isLoading}
          className={`relative w-11 h-6 rounded-full transition-colors ${boolValue ? "bg-primary" : "bg-muted"} disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${boolValue ? "translate-x-[22px]" : "translate-x-0.5"}`} />
        </button>
      </div>
    )
  }

  if (type === "Integer") {
    const range = (values?.range || values?.min !== undefined) ? values : null
    if (range && range.min !== undefined && range.max !== undefined) {
      const min = Number(range.min)
      const max = Number(range.max)
      const intValue = Number(currentValue) || Math.round((min + max) / 2)
      return (
        <div key={code} className="py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">{label}</span>
            <span className="text-sm text-muted-foreground">{intValue}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={intValue}
            onChange={(e) => onValueChange(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer"
            disabled={isLoading}
          />
        </div>
      )
    }
    const intValue = Number(currentValue) || 0
    const inputValue = inputValues[code] || String(intValue)
    return (
      <div key={code} className="flex items-center justify-between py-2">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(code, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onValueChange(Number(inputValue))
            }}
            className="w-20 px-2 py-1 text-sm bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/30 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => onValueChange(Number(inputValue))}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-muted hover:bg-muted/70 rounded-lg transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    )
  }

  if (type === "Enum") {
    const range = Array.isArray(values?.range) ? values.range : []
    const current = String(currentValue)
    return (
      <div key={code} className="py-2">
        <span className="text-sm block mb-2">{label}</span>
        <div className="flex flex-wrap gap-2">
          {range.map((option: string) => (
            <button
              key={option}
              onClick={() => onValueChange(option)}
              disabled={isLoading}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                current === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (type === "String") {
    const strValue = String(currentValue) || ""
    const inputValue = inputValues[code] || strValue
    return (
      <div key={code} className="flex items-center justify-between py-2">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(code, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onValueChange(inputValue)
            }}
            className="w-24 px-2 py-1 text-sm bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/30 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => onValueChange(inputValue)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-muted hover:bg-muted/70 rounded-lg transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    )
  }

  return null
}

interface DeviceState {
  switch?: boolean
  brightness?: number
  hexColor?: string
  sceneName?: string
  colorTemp?: number
}

export function DeviceListPanel() {
  const { devices, isRealPlatform } = useAppStore()
  const { tuyaClientId, tuyaSecret } = usePlatformConfigStore()
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set())
  const [expandedMoreFunctions, setExpandedMoreFunctions] = useState<Set<string>>(new Set())
  const [deviceStates, setDeviceStates] = useState<Record<string, DeviceState>>({})
  const [loadingDevices, setLoadingDevices] = useState<Set<string>>(new Set())
  const [acControls, setAcControls] = useState<Record<string, { mode: string; temp: number }>>({})
  const [deviceSpecs, setDeviceSpecs] = useState<Record<string, TuyaDeviceSpecification | null>>({})
  const [customValues, setCustomValues] = useState<Record<string, Record<string, unknown>>>({})
  const [customInputValues, setCustomInputValues] = useState<Record<string, Record<string, string>>>({})
  const colorDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const toggleExpand = useCallback((deviceId: string) => {
    setExpandedDevices((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) next.delete(deviceId)
      else next.add(deviceId)
      return next
    })
  }, [])

  const toggleMoreFunctions = useCallback((deviceId: string) => {
    setExpandedMoreFunctions((prev) => {
      const next = new Set(prev)
      if (next.has(deviceId)) next.delete(deviceId)
      else next.add(deviceId)
      return next
    })
  }, [])

  useEffect(() => {
    const fetchSpecs = async () => {
      if (!isRealPlatform || !tuyaClientId || !tuyaSecret) return
      for (const device of devices) {
        if (device.online && !deviceSpecs[device.id]) {
          const spec = await getDeviceSpecification(device.id)
          setDeviceSpecs((prev) => ({ ...prev, [device.id]: spec }))
        }
      }
    }
    fetchSpecs()
  }, [expandedDevices, devices, isRealPlatform, tuyaClientId, tuyaSecret, deviceSpecs])

  const executeCommand = useCallback(
    async (deviceId: string, commands: { code: string; value: unknown }[], context?: string) => {
      if (!isRealPlatform || !tuyaClientId || !tuyaSecret) {
        toast.warning("未连接真实涂鸦平台，无法控制设备")
        console.warn("[设备控制] 跳过：未连接真实平台")
        return false
      }

      console.log(`[设备控制] ${context || "发送指令"} → 设备ID: ${deviceId}`, JSON.stringify(commands))

      setLoadingDevices((prev) => new Set([...prev, deviceId]))
      try {
        const success = await sendDeviceCommand(deviceId, commands)
        if (!success) {
          const msg = `${context || "设备控制"}失败：设备未响应或拒绝了指令`
          console.error(`[设备控制] 失败 → 设备ID: ${deviceId}`, commands)
          toast.error(msg)
        } else {
          console.log(`[设备控制] 成功 → 设备ID: ${deviceId}`)
        }
        return success
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`[设备控制] 异常 → 设备ID: ${deviceId}, 错误: ${errorMsg}`)
        toast.error(`${context || "设备控制"}失败：${errorMsg}`)
        return false
      } finally {
        setLoadingDevices((prev) => {
          const next = new Set(prev)
          next.delete(deviceId)
          return next
        })
      }
    },
    [isRealPlatform, tuyaClientId, tuyaSecret]
  )

  const handleSwitch = useCallback(
    async (device: typeof devices[0]) => {
      const currentState = deviceStates[device.id]?.switch ?? false
      const nextState = !currentState
      const switchCode = getSwitchDpCode(device.type)
      const deviceName = getDeviceDisplayName(device)

      setDeviceStates((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], switch: nextState },
      }))

      const success = await executeCommand(device.id, [{ code: switchCode, value: nextState }], "开关控制")
      if (success) {
        toast.success(`${deviceName} 已${nextState ? "开启" : "关闭"}`)
      } else {
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: { ...prev[device.id], switch: currentState },
        }))
      }
    },
    [deviceStates, executeCommand]
  )

  const handleBrightnessChange = useCallback(
    async (device: typeof devices[0], brightness: number) => {
      setDeviceStates((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], brightness },
      }))

      const success = await executeCommand(device.id, [{ code: "bright_value", value: brightness }], "亮度调节")
      if (success) {
        toast.success(`亮度已调节至 ${Math.round(brightness / 10)}%`)
      } else {
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: { ...prev[device.id], brightness: deviceStates[device.id]?.brightness ?? 500 },
        }))
      }
    },
    [deviceStates, executeCommand]
  )

  const handleColorTempChange = useCallback(
    async (device: typeof devices[0], temp: number) => {
      setDeviceStates((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], colorTemp: temp },
      }))

      const tempCode = deviceSpecs[device.id]?.functions.find((f) => f.code === "temp_value" || f.code === "temp_value_v2")?.code || "temp_value"
      const success = await executeCommand(device.id, [{ code: tempCode, value: temp }], "色温调节")
      if (success) {
        toast.success(`色温已调节至 ${temp}`)
      }
    },
    [deviceStates, deviceSpecs, executeCommand]
  )

  const handleColorPickerChange = useCallback(
    (device: typeof devices[0], hexColor: string) => {
      setDeviceStates((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], hexColor, sceneName: undefined },
      }))

      if (colorDebounceRef.current[device.id]) {
        clearTimeout(colorDebounceRef.current[device.id])
      }
      colorDebounceRef.current[device.id] = setTimeout(async () => {
        const tuyaColor = rgbToTuyaColor(hexColor)
        console.log(`[颜色调节] hex: ${hexColor}, colourData: ${tuyaColor.colourData}, 设备ID: ${device.id}`)
        const commands: { code: string; value: unknown }[] = [
          { code: "work_mode", value: "colour" },
          { code: "colour_data", value: tuyaColor.colourData },
        ]
        const success = await executeCommand(device.id, commands, "颜色调节")
        if (success) {
          toast.success("颜色已应用")
        }
      }, 400)
    },
    [executeCommand]
  )

  const handlePresetColor = useCallback(
    async (device: typeof devices[0], hex: string) => {
      const tuyaColor = rgbToTuyaColor(hex)
      console.log(`[预设颜色] hex: ${hex}, colourData: ${tuyaColor.colourData}, 设备ID: ${device.id}`)

      setDeviceStates((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], hexColor: hex, sceneName: undefined },
      }))

      const commands: { code: string; value: unknown }[] = [
        { code: "work_mode", value: "colour" },
        { code: "colour_data", value: tuyaColor.colourData },
      ]
      const success = await executeCommand(device.id, commands, `颜色: ${hex}`)
      if (success) {
        toast.success("颜色已应用")
      }
    },
    [executeCommand]
  )

  const handleSceneColor = useCallback(
    async (device: typeof devices[0], scene: typeof sceneColors[0]) => {
      const tuyaColor = rgbToTuyaColor(scene.hex, scene.brightness)
      console.log(`[情景切换] 点击情景: ${scene.name}, hex: ${scene.hex}, brightness: ${scene.brightness}, 转换后 colourData: ${tuyaColor.colourData}, 设备ID: ${device.id}`)

      const commands: { code: string; value: unknown }[] = [
        { code: "work_mode", value: "colour" },
        { code: "colour_data", value: tuyaColor.colourData },
        { code: "bright_value", value: scene.brightness },
      ]

      console.log(`[情景切换] 下发指令 → 设备ID: ${device.id}`, JSON.stringify(commands))

      const success = await executeCommand(device.id, commands, `情景「${scene.name}」`)
      if (success) {
        toast.success(`已切换到「${scene.name}」`)
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: { ...prev[device.id], hexColor: scene.hex, brightness: scene.brightness, sceneName: scene.name },
        }))
      }
    },
    [executeCommand]
  )

  const handleCustomFunction = useCallback(
    async (device: typeof devices[0], code: string, value: unknown) => {
      setCustomValues((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], [code]: value },
      }))
      console.log(`[更多功能] ${getDpCodeLabel(code)} → 设备ID: ${device.id}, value:`, value)
      const success = await executeCommand(device.id, [{ code, value }], getDpCodeLabel(code))
      if (success) {
        toast.success(`${getDpCodeLabel(code)} 已设置`)
      }
    },
    [executeCommand]
  )

  const handleAcModeChange = useCallback(
    async (device: typeof devices[0], mode: string) => {
      setAcControls((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], mode },
      }))
      const success = await executeCommand(device.id, [{ code: "mode", value: mode }], "空调模式")
      if (success) {
        const modeText = mode === "cool" ? "制冷" : mode === "heat" ? "制热" : mode === "auto" ? "自动" : mode
        toast.success(`空调已切换至${modeText}模式`)
      }
    },
    [executeCommand]
  )

  const handleAcTempChange = useCallback(
    async (device: typeof devices[0], temp: number) => {
      setAcControls((prev) => ({
        ...prev,
        [device.id]: { ...prev[device.id], temp },
      }))
      const success = await executeCommand(device.id, [{ code: "temp_set", value: temp }], "空调温度")
      if (success) {
        toast.success(`空调温度已设为 ${temp}°C`)
      }
    },
    [executeCommand]
  )

  const handleCurtainControl = useCallback(
    async (device: typeof devices[0], control: "open" | "close" | "stop") => {
      const success = await executeCommand(device.id, [{ code: "control", value: control }], "窗帘控制")
      if (success) {
        const controlText = control === "open" ? "已打开" : control === "close" ? "已关闭" : "已暂停"
        toast.success(`窗帘${controlText}`)
      }
    },
    [executeCommand]
  )

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Wifi className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">暂未连接设备</p>
        <p className="text-sm text-muted-foreground">请先连接涂鸦平台</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold text-foreground">我的设备</h2>
        <span className="text-xs text-muted-foreground">{devices.length} 台设备</span>
      </div>

      <div className="space-y-3">
        {devices.map((device) => {
          const Icon = categoryIcons[device.category] || Lightbulb
          const catText = categoryChinese[device.category] || device.category
          const catEng = categoryEnglish[device.category] || device.category
          const isExpanded = expandedDevices.has(device.id)
          const isLoading = loadingDevices.has(device.id)
          const deviceState = deviceStates[device.id] || {}
          const acControl = acControls[device.id] || { mode: "cool", temp: 26 }
          const spec = deviceSpecs[device.id]

          const isControllable = ["light", "switch", "ac", "curtain", "fan", "tv", "speaker", "lock", "heater", "purifier", "robot"].includes(device.type)
          const hasBrightness = device.type === "light"
          const hasColor = device.type === "light"
          const isAc = device.type === "ac"
          const isCurtain = device.type === "curtain"

          const colorTempFunc = spec?.functions.find((f) => f.code === "temp_value" || f.code === "temp_value_v2")
          const hasColorTemp = !!colorTempFunc
          const tempMin = colorTempFunc?.values?.min ? Number(colorTempFunc.values.min) : 0
          const tempMax = colorTempFunc?.values?.max ? Number(colorTempFunc.values.max) : 1000

          const customFunctions = spec?.functions.filter((f) => !standardDpCodes.has(f.code) && dpCodeChinese[f.code]) || []
          const isMoreExpanded = expandedMoreFunctions.has(device.id)

          return (
            <div
              key={device.id}
              className="rounded-xl bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* 标题栏 */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => isControllable && toggleExpand(device.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${device.online ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate leading-tight">{getDeviceDisplayName(device)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{catEng}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${device.online ? "bg-green-500" : "bg-gray-400"}`} />
                      <span className="text-xs text-muted-foreground">
                        {device.online ? "在线" : "离线"} · {catText} · WiFi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isControllable && device.online && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSwitch(device)
                        }}
                        disabled={isLoading}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          deviceState.switch ? "bg-primary" : "bg-muted"
                        } disabled:opacity-50`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                            deviceState.switch ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    )}
                    {isControllable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(device.id)
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 展开区域 */}
              {isExpanded && isControllable && device.online && (
                <div className="px-4 pb-4 space-y-5">
                  {/* 亮度调节 */}
                  {hasBrightness && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">亮度</span>
                        <span className="text-lg font-bold text-primary tabular-nums">
                          {Math.round((deviceState.brightness ?? 500) / 10)}<span className="text-xs font-normal text-muted-foreground">%</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={deviceState.brightness ?? 500}
                          onChange={(e) => handleBrightnessChange(device, Number(e.target.value))}
                          className="flex-1 h-2.5 rounded-full bg-muted appearance-none cursor-pointer"
                          disabled={isLoading}
                        />
                        <Sun className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  )}

                  {/* 色温调节 */}
                  {hasColorTemp && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">色温</span>
                        <span className="text-sm text-muted-foreground tabular-nums">{deviceState.colorTemp ?? 500}</span>
                      </div>
                      <input
                        type="range"
                        min={tempMin}
                        max={tempMax}
                        value={deviceState.colorTemp ?? Math.round((tempMin + tempMax) / 2)}
                        onChange={(e) => handleColorTempChange(device, Number(e.target.value))}
                        className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: "linear-gradient(to right, #FFD580, #F5F5F5)" }}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* 颜色控制 */}
                  {hasColor && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">颜色</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-muted"
                            style={{ backgroundColor: deviceState.hexColor || "#FFD580" }}
                          />
                          <input
                            type="color"
                            value={deviceState.hexColor || "#FFD580"}
                            onChange={(e) => handleColorPickerChange(device, e.target.value)}
                            className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {presetColorCircles.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handlePresetColor(device, color.hex)}
                            disabled={isLoading}
                            title={color.name}
                            className={`w-9 h-9 rounded-full transition-transform active:scale-90 ${
                              deviceState.hexColor?.toUpperCase() === color.hex.toUpperCase()
                                ? "ring-2 ring-primary ring-offset-2"
                                : "ring-0"
                            }`}
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 情景推荐 */}
                  {hasColor && (
                    <div>
                      <span className="text-sm font-medium text-foreground block mb-3">情景模式</span>
                      <div className="grid grid-cols-2 gap-2">
                        {sceneColors.map((scene) => {
                          const isSelected = deviceState.sceneName === scene.name
                          return (
                            <button
                              key={scene.name}
                              onClick={() => handleSceneColor(device, scene)}
                              disabled={isLoading}
                              className={`flex items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : `${scene.bg} text-foreground hover:${scene.activeBg}`
                              }`}
                            >
                              <span className="text-xl shrink-0">{scene.emoji}</span>
                              <span className="text-sm font-medium truncate">{scene.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 空调控制 */}
                  {isAc && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">温度</span>
                        <span className="text-2xl font-bold text-primary tabular-nums">{acControl.temp}°</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => handleAcTempChange(device, Math.max(16, acControl.temp - 1))}
                          disabled={isLoading}
                          className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 text-center text-lg font-medium transition-colors flex items-center justify-center"
                        >
                          −
                        </button>
                        <input
                          type="range"
                          min="16"
                          max="30"
                          value={acControl.temp}
                          onChange={(e) => handleAcTempChange(device, Number(e.target.value))}
                          className="flex-1 h-2.5 rounded-full bg-muted appearance-none cursor-pointer"
                          disabled={isLoading}
                        />
                        <button
                          onClick={() => handleAcTempChange(device, Math.min(30, acControl.temp + 1))}
                          disabled={isLoading}
                          className="w-9 h-9 rounded-full bg-muted hover:bg-muted/70 text-center text-lg font-medium transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {[
                          { mode: "cool", label: "制冷", icon: CloudSun },
                          { mode: "heat", label: "制热", icon: Flame },
                          { mode: "auto", label: "自动", icon: Sun },
                        ].map(({ mode, label, icon: ModeIcon }) => (
                          <button
                            key={mode}
                            onClick={() => handleAcModeChange(device, mode)}
                            disabled={isLoading}
                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              acControl.mode === mode
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/70 text-foreground"
                            }`}
                          >
                            <ModeIcon className="h-3.5 w-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 窗帘控制 */}
                  {isCurtain && (
                    <div>
                      <span className="text-sm font-medium text-foreground block mb-3">窗帘控制</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleCurtainControl(device, "open")}
                          disabled={isLoading}
                          className="py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <ChevronUp className="h-5 w-5" />
                          打开
                        </button>
                        <button
                          onClick={() => handleCurtainControl(device, "stop")}
                          disabled={isLoading}
                          className="py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <Power className="h-5 w-5" />
                          暂停
                        </button>
                        <button
                          onClick={() => handleCurtainControl(device, "close")}
                          disabled={isLoading}
                          className="py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-colors flex flex-col items-center gap-1"
                        >
                          <ChevronDown className="h-5 w-5" />
                          关闭
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 更多功能（折叠） */}
                  {customFunctions.length > 0 && (
                    <div className="border-t pt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMoreFunctions(device.id)
                        }}
                        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>更多功能</span>
                        {isMoreExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {isMoreExpanded && (
                        <div className="mt-3 bg-muted/40 rounded-xl p-3 space-y-1">
                          {customFunctions.map((func) => {
                            const currentValue = customValues[device.id]?.[func.code]
                            const inputValues = customInputValues[device.id] || {}
                            return generateControlUI(
                              func,
                              currentValue,
                              inputValues,
                              (code, value) =>
                                setCustomInputValues((prev) => ({
                                  ...prev,
                                  [device.id]: { ...prev[device.id], [code]: value },
                                })),
                              (value) => handleCustomFunction(device, func.code, value),
                              isLoading
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground/60">ID: {device.id}</span>
                    <span className="text-xs text-muted-foreground/60">{catEng}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
