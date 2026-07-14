import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SceneTemplate, Device, SceneRule, DeviceType, DeviceCategory } from "@/engine/types"
import { defaultTemplates } from "@/engine/templates"
import { fillTemplate, parseNaturalLanguage } from "@/engine/templateParser"
import { generateTuyaRule, validateRule } from "@/engine/ruleGenerator"
import { defaultDeviceNames } from "@/engine/defaultDevices"
import type { BasePlatform } from "@/platforms/index"
import { MockTuyaPlatform } from "@/platforms/mockTuya"
import { RealTuyaPlatform } from "@/platforms/realTuya"
import { usePlatformConfigStore } from "@/stores/usePlatformConfigStore"
import { getAccessToken, getDevicesByUser, type TuyaDevice } from "@/platforms/tuyaApi"

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

function mapTuyaDevice(tuyaDevice: TuyaDevice): Device {
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

interface AppState {
  mode: "template" | "natural" | "devices"
  platformStatus: "disconnected" | "connected"
  platform: BasePlatform | null
  isRealPlatform: boolean
  selectedTemplateId: string | null
  selectedTemplateParams: Record<string, string>
  generatedRule: object | null
  templates: SceneTemplate[]
  devices: Device[]
  isGenerating: boolean
  generationError: string | null
  naturalLanguageInput: string
  naturalLanguageMode: "basic" | "advanced"
  executionResult: { success: boolean; message: string } | null
  savedRules: SceneRule[]

  setMode: (mode: "template" | "natural" | "devices") => void
  setPlatformStatus: (status: "disconnected" | "connected") => void
  setSelectedTemplateId: (id: string | null) => void
  setSelectedTemplateParams: (params: Record<string, string>) => void
  updateParam: (key: string, value: string) => void
  generateRule: () => void
  generateFromNaturalLanguage: () => boolean
  clearRule: () => void
  setGeneratedRule: (rule: object) => void
  setGenerationError: (error: string | null) => void
  connectTuyaPlatform: () => Promise<void>
  disconnectPlatform: () => void
  refreshDevices: () => Promise<void>
  executeRule: () => Promise<void>
  setDevices: (devices: Device[]) => void
  setNaturalLanguageInput: (input: string) => void
  setNaturalLanguageMode: (mode: "basic" | "advanced") => void
  saveRule: () => void
  deleteRule: (ruleId: string) => void
  loadRule: (ruleId: string) => void
  updateRule: (updatedRule: SceneRule) => void
}

export const useAppStore = create<
  AppState,
  [["zustand/persist", { savedRules: SceneRule[] }]]
>(
  persist(
    (set, get) => ({
      mode: "template",
      platformStatus: "disconnected",
      platform: null,
      isRealPlatform: false,
      selectedTemplateId: null,
      selectedTemplateParams: {},
      generatedRule: null,
      templates: defaultTemplates,
      devices: [],
      isGenerating: false,
      generationError: null,
      naturalLanguageInput: "",
      naturalLanguageMode: "basic",
      executionResult: null,
      savedRules: [],

  setMode: (mode) => set({ mode }),

  setPlatformStatus: (status) => set({ platformStatus: status }),

  setSelectedTemplateId: (id) => {
    set({ selectedTemplateId: id })
    if (id) {
      const template = get().templates.find((t) => t.id === id)
      if (template) {
        const defaultParams: Record<string, string> = {}
        const { devices } = get()
        template.params.forEach((param) => {
          if (param.defaultValue !== undefined) {
            defaultParams[param.key] = String(param.defaultValue)
          }
          if (param.type === "deviceSelect" && param.defaultName && devices.length === 0) {
            defaultParams[param.key] = param.defaultName
          }
        })
        set({ selectedTemplateParams: defaultParams })
      }
    } else {
      set({ selectedTemplateParams: {} })
    }
  },

  setSelectedTemplateParams: (params) => set({ selectedTemplateParams: params }),

  updateParam: (key, value) =>
    set((state) => ({
      selectedTemplateParams: { ...state.selectedTemplateParams, [key]: value },
    })),

  generateRule: () => {
    const { selectedTemplateId, selectedTemplateParams } = get()

    if (!selectedTemplateId) {
      set({ generationError: "请先选择一个场景模板" })
      return
    }

    try {
      const filledRule = fillTemplate(selectedTemplateId, selectedTemplateParams)
      const tuyaRule = generateTuyaRule(filledRule)
      const validation = validateRule(tuyaRule)

      if (!validation.valid) {
        set({ generationError: validation.errors.join("; ") })
        return
      }

      set({ generatedRule: tuyaRule, generationError: null })
    } catch (error) {
      set({ generationError: error instanceof Error ? error.message : "生成规则失败" })
    }
  },

  generateFromNaturalLanguage: (): boolean => {
    const { naturalLanguageInput, templates } = get()
    set({ isGenerating: true, generationError: null })

    const result = parseNaturalLanguage(naturalLanguageInput)

    if (!result) {
      set({ isGenerating: false, generationError: "无法识别您的指令，请尝试用其他方式描述" })
      return false
    }

    const { templateId, extractedParams } = result
    const template = templates.find((t) => t.id === templateId)

    if (!template) {
      set({ isGenerating: false, generationError: "模板不存在" })
      return false
    }

    const { devices } = get()
    const defaultParams: Record<string, string> = {}

    template.params.forEach((param) => {
      if (param.type === "deviceSelect") {
        if (extractedParams[param.key]) {
          defaultParams[param.key] = extractedParams[param.key]
        } else if (devices.length > 0 && param.deviceType) {
          const matchedDevices = devices.filter((d) => d.category === param.deviceType)
          if (matchedDevices.length > 0) {
            defaultParams[param.key] = matchedDevices[0].name
          } else if (param.defaultName) {
            defaultParams[param.key] = param.defaultName
          } else {
            const names = defaultDeviceNames[param.deviceType] || []
            if (names.length > 0) {
              defaultParams[param.key] = names[0]
            }
          }
        } else if (param.defaultName) {
          defaultParams[param.key] = param.defaultName
        } else if (param.deviceType) {
          const names = defaultDeviceNames[param.deviceType] || []
          if (names.length > 0) {
            defaultParams[param.key] = names[0]
          }
        }
      } else if (extractedParams[param.key] !== undefined) {
        defaultParams[param.key] = extractedParams[param.key]
      } else if (param.defaultValue !== undefined) {
        defaultParams[param.key] = String(param.defaultValue)
      }
    })

    if (extractedParams.time && template.params.some((p) => p.key.includes("time"))) {
      template.params.forEach((param) => {
        if (param.key.includes("time") && defaultParams[param.key] === undefined) {
          defaultParams[param.key] = extractedParams.time
        }
      })
    }

    try {
      const filledRule = fillTemplate(templateId, defaultParams)
      const tuyaRule = generateTuyaRule(filledRule)
      const validation = validateRule(tuyaRule)

      if (!validation.valid) {
        set({ isGenerating: false, generationError: validation.errors.join("; ") })
        return false
      }

      set({
        generatedRule: tuyaRule,
        generationError: null,
        isGenerating: false,
        selectedTemplateId: templateId,
        selectedTemplateParams: defaultParams,
      })
      return true
    } catch (error) {
      set({ isGenerating: false, generationError: error instanceof Error ? error.message : "生成规则失败" })
      return false
    }
  },

  clearRule: () =>
    set({
      generatedRule: null,
      generationError: null,
      selectedTemplateId: null,
      selectedTemplateParams: {},
    }),

  setGeneratedRule: (rule: object) => set({ generatedRule: rule, generationError: null }),

  setGenerationError: (error: string | null) => set({ generationError: error }),

  connectTuyaPlatform: async () => {
    const { tuyaClientId, tuyaSecret, tuyaRegion, tuyaUserId } = usePlatformConfigStore.getState()
    const useRealApi = !!tuyaClientId && !!tuyaSecret

    let platform: BasePlatform
    let success: boolean

    if (useRealApi) {
      platform = new RealTuyaPlatform()
      success = await platform.connect({
        clientId: tuyaClientId,
        secret: tuyaSecret,
        region: tuyaRegion,
      })
    } else {
      platform = new MockTuyaPlatform()
      success = await platform.connect({})
    }

    if (success) {
      let devices: Device[] = []
      let isReal = useRealApi

      if (useRealApi && tuyaUserId) {
        try {
          const token = await getAccessToken()
          const tuyaDevices = await getDevicesByUser(token.access_token, tuyaUserId)
          devices = tuyaDevices.map(mapTuyaDevice)
        } catch (error) {
          console.error("获取用户设备失败，降级到模拟模式", error)
          const mockPlatform = new MockTuyaPlatform()
          await mockPlatform.connect({})
          devices = await mockPlatform.getDevices()
          platform = mockPlatform
          isReal = false
        }
      } else if (useRealApi && !tuyaUserId) {
        const mockPlatform = new MockTuyaPlatform()
        await mockPlatform.connect({})
        devices = await mockPlatform.getDevices()
        platform = mockPlatform
        isReal = false
      } else {
        devices = await platform.getDevices()
      }

      if (platform instanceof RealTuyaPlatform) {
        platform.setDevices(devices)
      }

      set({ platform, platformStatus: "connected", devices, isRealPlatform: isReal })
    } else if (useRealApi) {
      const mockPlatform = new MockTuyaPlatform()
      await mockPlatform.connect({})
      const devices = await mockPlatform.getDevices()
      set({ platform: mockPlatform, platformStatus: "connected", devices, isRealPlatform: false })
      set({ generationError: "真实 API 连接失败，已切换到模拟模式" })
    }
  },

  disconnectPlatform: () => {
    const { platform } = get()
    platform?.disconnect()
    set({ platform: null, platformStatus: "disconnected", devices: [] })
  },

  refreshDevices: async () => {
    const { platform } = get()
    if (platform) {
      const devices = await platform.getDevices()
      set({ devices })
    }
  },

  executeRule: async () => {
    const { generatedRule, platform, devices } = get()
    const { tuyaClientId, tuyaSecret } = usePlatformConfigStore.getState()
    
    if (!generatedRule) {
      set({ generationError: "请先生成规则" })
      return
    }
    
    if (!platform) {
      set({ generationError: "请先连接平台" })
      return
    }
    
    const rule = generatedRule as SceneRule
    const missingDevices: string[] = []
    
    const resolveDeviceId = (entityId: string): string | null => {
      const deviceById = devices.find(d => d.id === entityId)
      if (deviceById) return deviceById.id
      
      const deviceByName = devices.find(d => d.name === entityId)
      if (deviceByName) return deviceByName.id
      
      const deviceByType = devices.find(d => d.type === entityId)
      if (deviceByType) return deviceByType.id
      
      return null
    }
    
    const resolvedRule: SceneRule = {
      ...rule,
      actions: (rule.actions || []).filter((action) => {
        const resolvedId = resolveDeviceId(action.entityId)
        if (!resolvedId) {
          missingDevices.push(action.entityId)
          return false
        }
        action.entityId = resolvedId
        return true
      }),
    }
    
    if (missingDevices.length > 0) {
      set({ generationError: `以下设备未找到：${missingDevices.join('、')}，已跳过` })
    }
    
    set({ executionResult: null })
    const result = await platform.executeRule(resolvedRule)

    if (!tuyaClientId || !tuyaSecret) {
      result.message = result.message + "（未配置涂鸦 API，使用模拟模式）"
    }

    set({ executionResult: result, generationError: null })
  },

  setDevices: (devices) => set({ devices }),

  setNaturalLanguageInput: (input) => set({ naturalLanguageInput: input }),

  setNaturalLanguageMode: (mode) => set({ naturalLanguageMode: mode }),

  saveRule: () => {
    const { generatedRule, savedRules } = get()
    
    if (!generatedRule) {
      set({ generationError: "没有可保存的规则" })
      return
    }

    const rule = generatedRule as SceneRule
    const existingIndex = savedRules.findIndex((r) => r.id === rule.id)
    
    if (existingIndex >= 0) {
      const updatedRules = [...savedRules]
      updatedRules[existingIndex] = rule
      set({ savedRules: updatedRules })
    } else {
      set({ savedRules: [...savedRules, rule] })
    }
    
    set({ executionResult: { success: true, message: "场景已保存" } })
  },

  deleteRule: (ruleId: string) => {
    const { savedRules, generatedRule } = get()
    const newSavedRules = savedRules.filter((r) => r.id !== ruleId)
    
    const rule = generatedRule as SceneRule
    const shouldClearGenerated = rule?.id === ruleId
    
    set({
      savedRules: newSavedRules,
      generatedRule: shouldClearGenerated ? null : generatedRule,
    })
  },

  loadRule: (ruleId: string) => {
    const { savedRules } = get()
    const rule = savedRules.find((r) => r.id === ruleId)
    
    if (rule) {
      set({ generatedRule: rule })
    }
  },

  updateRule: (updatedRule: SceneRule) => {
    const { savedRules } = get()
    
    set({ generatedRule: updatedRule })
    
    const existingIndex = savedRules.findIndex((r) => r.id === updatedRule.id)
    if (existingIndex >= 0) {
      const updatedRules = [...savedRules]
      updatedRules[existingIndex] = updatedRule
      set({ savedRules: updatedRules })
    }
  },
    }),
    {
      name: "smart-home-rules",
      partialize: (state) => ({ savedRules: state.savedRules }),
    }
  )
)
