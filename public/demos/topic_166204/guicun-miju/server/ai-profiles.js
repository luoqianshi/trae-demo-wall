import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { AI_PROVIDER_PRESETS, DEFAULT_PROVIDER_ID, getProviderPreset } from './ai-providers.js'
import { getAiConfig, NpcAiError } from './npc-ai.js'

const CONFIG_VERSION = 1
const MAX_PROFILES = 20

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeBaseUrl(value) {
  const raw = cleanText(value, 1000)
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/i, '')
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new NpcAiError('INVALID_BASE_URL', '请输入有效的接口地址。', 400)
  }

  const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new NpcAiError('INVALID_BASE_URL', '远程接口必须使用 HTTPS。', 400)
  }
  if (url.username || url.password) {
    throw new NpcAiError('INVALID_BASE_URL', '接口地址不能包含用户名或密码。', 400)
  }
  return raw
}

function maskApiKey(apiKey) {
  if (!apiKey) return ''
  return apiKey.length > 8 ? `••••${apiKey.slice(-4)}` : '••••'
}

function validateProfileInput(input, existingProfile = null) {
  const providerId = cleanText(input?.providerId, 40)
    || existingProfile?.providerId
    || DEFAULT_PROVIDER_ID
  const preset = AI_PROVIDER_PRESETS.find((provider) => provider.id === providerId)
  if (!preset) {
    throw new NpcAiError('INVALID_PROVIDER', '未知的接口厂商。', 400)
  }

  const name = cleanText(input?.name, 60) || existingProfile?.name || preset.name
  const baseUrl = normalizeBaseUrl(input?.baseUrl || existingProfile?.baseUrl || preset.baseUrl)
  const model = cleanText(input?.model || existingProfile?.model || preset.model, 200)
  const submittedKey = cleanText(input?.apiKey, 2000)
  const apiKey = submittedKey || existingProfile?.apiKey || ''

  if (!model) throw new NpcAiError('MODEL_REQUIRED', '请填写模型名称。', 400)
  if (!apiKey) throw new NpcAiError('API_KEY_REQUIRED', '请填写 API Key。', 400)

  return { name, providerId, baseUrl, model, apiKey }
}

function publicProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    providerId: profile.providerId,
    baseUrl: profile.baseUrl,
    model: profile.model,
    hasKey: Boolean(profile.apiKey),
    keyHint: maskApiKey(profile.apiKey),
    readonly: false
  }
}

export class AiProfileStore {
  constructor(options = {}) {
    this.env = options.env || process.env
    this.filePath = options.filePath || resolve(
      options.rootDirectory || process.cwd(),
      '.runtime/ai-profiles.json'
    )
    this.profiles = []
    this.activeProfileId = null
    this.load()
  }

  load() {
    if (!existsSync(this.filePath)) return
    try {
      const data = JSON.parse(readFileSync(this.filePath, 'utf8'))
      if (data.version !== CONFIG_VERSION || !Array.isArray(data.profiles)) return
      this.profiles = data.profiles
        .filter((profile) => profile && typeof profile.id === 'string')
        .slice(0, MAX_PROFILES)
        .map((profile) => ({
          id: cleanText(profile.id, 80),
          name: cleanText(profile.name, 60),
          providerId: cleanText(profile.providerId, 40) || 'custom',
          baseUrl: cleanText(profile.baseUrl, 1000).replace(/\/+$/, ''),
          model: cleanText(profile.model, 200),
          apiKey: cleanText(profile.apiKey, 2000)
        }))
        .filter((profile) => profile.name && profile.baseUrl && profile.model && profile.apiKey)
      const environmentSelected = data.activeProfileId === 'environment' && this.getEnvironmentProfile()
      this.activeProfileId = environmentSelected
        ? 'environment'
        : this.profiles.some((profile) => profile.id === data.activeProfileId)
          ? data.activeProfileId
          : this.profiles[0]?.id || null
    } catch (error) {
      console.error('[ai-config] 无法读取本地 AI 配置：', error.message)
      this.profiles = []
      this.activeProfileId = null
    }
  }

  persist() {
    mkdirSync(dirname(this.filePath), { recursive: true, mode: 0o700 })
    const tempPath = `${this.filePath}.tmp`
    writeFileSync(tempPath, JSON.stringify({
      version: CONFIG_VERSION,
      activeProfileId: this.activeProfileId,
      profiles: this.profiles
    }, null, 2), { mode: 0o600 })
    renameSync(tempPath, this.filePath)
    try {
      chmodSync(this.filePath, 0o600)
    } catch {
      // Windows 文件系统可能不支持 POSIX 权限，仍保持文件仅位于本地运行目录。
    }
  }

  getEnvironmentProfile() {
    const config = getAiConfig(this.env)
    if (!config.apiKey) return null
    return {
      id: 'environment',
      name: '环境变量配置',
      providerId: 'custom',
      baseUrl: config.baseUrl,
      model: config.model,
      hasKey: true,
      keyHint: maskApiKey(config.apiKey),
      readonly: true
    }
  }

  getPublicState() {
    const environmentProfile = this.getEnvironmentProfile()
    const storedProfiles = this.profiles.map(publicProfile)
    const profiles = environmentProfile ? [environmentProfile, ...storedProfiles] : storedProfiles
    const activeProfileId = this.activeProfileId
      || environmentProfile?.id
      || null

    return {
      defaultProviderId: DEFAULT_PROVIDER_ID,
      presets: AI_PROVIDER_PRESETS,
      profiles,
      activeProfileId,
      requiresSetup: !this.getActiveConfig().apiKey
    }
  }

  getActiveConfig() {
    const profile = this.profiles.find((item) => item.id === this.activeProfileId)
    if (profile) {
      return {
        apiKey: profile.apiKey,
        baseUrl: profile.baseUrl,
        model: profile.model,
        timeoutMs: Math.max(3000, Number.parseInt(this.env.AI_TIMEOUT_MS, 10) || 25000)
      }
    }
    return getAiConfig(this.env)
  }

  saveProfile(input) {
    const requestedId = cleanText(input?.id, 80)
    const existingIndex = this.profiles.findIndex((profile) => profile.id === requestedId)
    const existing = existingIndex >= 0 ? this.profiles[existingIndex] : null
    if (!existing && this.profiles.length >= MAX_PROFILES) {
      throw new NpcAiError('PROFILE_LIMIT', `最多保存 ${MAX_PROFILES} 个 AI 接口。`, 400)
    }

    const values = validateProfileInput(input, existing)
    const profile = {
      id: existing?.id || randomUUID(),
      ...values
    }
    if (existingIndex >= 0) this.profiles.splice(existingIndex, 1, profile)
    else this.profiles.push(profile)
    this.activeProfileId = profile.id
    this.persist()
    return this.getPublicState()
  }

  activateProfile(profileId) {
    const id = cleanText(profileId, 80)
    if (id === 'environment' && this.getEnvironmentProfile()) {
      this.activeProfileId = 'environment'
      this.persist()
      return this.getPublicState()
    }
    if (!this.profiles.some((profile) => profile.id === id)) {
      throw new NpcAiError('PROFILE_NOT_FOUND', '未找到该 AI 接口。', 404)
    }
    this.activeProfileId = id
    this.persist()
    return this.getPublicState()
  }

  deleteProfile(profileId) {
    const id = cleanText(profileId, 80)
    const index = this.profiles.findIndex((profile) => profile.id === id)
    if (index < 0) throw new NpcAiError('PROFILE_NOT_FOUND', '未找到该 AI 接口。', 404)
    this.profiles.splice(index, 1)
    if (this.activeProfileId === id) {
      this.activeProfileId = this.profiles[0]?.id || null
    }
    this.persist()
    return this.getPublicState()
  }

  resolveTestConfig(input) {
    if (input?.id === 'environment') {
      const environmentConfig = getAiConfig(this.env)
      if (!environmentConfig.apiKey) {
        throw new NpcAiError('API_KEY_REQUIRED', '环境变量中没有 API Key。', 400)
      }
      return environmentConfig
    }
    const existing = this.profiles.find((profile) => profile.id === cleanText(input?.id, 80))
    const values = validateProfileInput(input, existing)
    return {
      apiKey: values.apiKey,
      baseUrl: values.baseUrl,
      model: values.model,
      timeoutMs: Math.max(3000, Number.parseInt(this.env.AI_TIMEOUT_MS, 10) || 25000)
    }
  }
}

export function createAiProfileStore(options) {
  return new AiProfileStore(options)
}

export function getDefaultProfileDraft() {
  const preset = getProviderPreset(DEFAULT_PROVIDER_ID)
  return {
    name: preset.name,
    providerId: preset.id,
    baseUrl: preset.baseUrl,
    model: preset.model
  }
}
