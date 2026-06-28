import { useCallback, useMemo, useState } from 'react'
import type { VisionConfigStatus, VisionRuntimeConfig, VisionTestResponse } from '../../shared/vision-config'
import {
  emptyVisionRuntimeConfig,
  isVisionRuntimeConfigComplete,
  sanitizeVisionRuntimeConfig,
  visionConfigStorageKey,
} from '../../shared/vision-config'

export function readVisionConfigFromStorage(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(visionConfigStorageKey)
    if (!raw) {
      return emptyVisionRuntimeConfig
    }

    const parsed = JSON.parse(raw) as VisionRuntimeConfig
    return sanitizeVisionRuntimeConfig(parsed)
  } catch {
    return emptyVisionRuntimeConfig
  }
}

export function writeVisionConfigToStorage(
  config: VisionRuntimeConfig,
  storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage,
) {
  storage?.setItem(visionConfigStorageKey, JSON.stringify(sanitizeVisionRuntimeConfig(config)))
}

export function clearVisionConfigFromStorage(storage: Pick<Storage, 'removeItem'> | undefined = globalThis.localStorage) {
  storage?.removeItem(visionConfigStorageKey)
}

export function useVisionConfig() {
  const [config, setConfig] = useState<VisionRuntimeConfig>(() => readVisionConfigFromStorage())
  const [status, setStatus] = useState<VisionConfigStatus>(() =>
    isVisionRuntimeConfigComplete(readVisionConfigFromStorage()) ? 'saved' : 'missing',
  )
  const [message, setMessage] = useState('填写 Base URL、API Key 和模型名后，可测试真实识别连接。')

  const isConfigured = useMemo(() => isVisionRuntimeConfigComplete(config), [config])

  const saveConfig = useCallback((nextConfig: VisionRuntimeConfig) => {
    const sanitized = sanitizeVisionRuntimeConfig(nextConfig)
    writeVisionConfigToStorage(sanitized)
    setConfig(sanitized)
    setStatus(isVisionRuntimeConfigComplete(sanitized) ? 'saved' : 'missing')
    setMessage(
      isVisionRuntimeConfigComplete(sanitized)
        ? '配置已本地保存，请点击测试连接验证真实模型是否可用。'
        : '请补全 Base URL、API Key 和模型名。',
    )
  }, [])

  const clearConfig = useCallback(() => {
    clearVisionConfigFromStorage()
    setConfig(emptyVisionRuntimeConfig)
    setStatus('missing')
    setMessage('已清除本地配置，系统将继续使用模拟模式。')
  }, [])

  const testConnection = useCallback(async () => {
    if (!isVisionRuntimeConfigComplete(config)) {
      setStatus('missing')
      setMessage('请先填写完整的 Base URL、API Key 和模型名。')
      return { ok: false, message: 'missing' }
    }

    setStatus('testing')
    setMessage('正在测试真实模型连接，请稍候。')

    try {
      const response = await fetch('/api/vision/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
        }),
      })

      const data = (await response.json()) as VisionTestResponse
      setStatus(data.ok ? 'valid' : 'invalid')
      setMessage(data.message)
      return data
    } catch {
      setStatus('invalid')
      setMessage('测试连接失败，请检查本地代理服务和网络配置。')
      return { ok: false, message: 'network_error' }
    }
  }, [config])

  return {
    config,
    isConfigured,
    status,
    message,
    saveConfig,
    clearConfig,
    testConnection,
  }
}
