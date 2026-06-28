import type { VisionAnalyzeRequest } from '../../../shared/vision-config'
import { appConfig } from '@/config/appConfig'
import { readVisionConfigFromStorage } from '@/hooks/useVisionConfig'
import type { FramePayload, NarrationResult, VisionProvider } from '@/services/vision/types'

export function hasRealVisionConfig() {
  const config = readVisionConfigFromStorage()
  return Boolean(config.baseUrl && config.apiKey && config.model)
}

export class RealVisionProvider implements VisionProvider {
  async describeFrame(frame: FramePayload): Promise<NarrationResult> {
    const config = readVisionConfigFromStorage()

    if (!hasRealVisionConfig()) {
      throw new Error('未配置真实视觉服务')
    }

    const requestBody: VisionAnalyzeRequest = {
      image: frame.dataUrl,
      capturedAt: frame.capturedAt,
      config,
    }

    const response = await fetch(`${appConfig.backendApiBaseUrl}/api/vision/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error('真实视觉服务调用失败')
    }

    return (await response.json()) as NarrationResult
  }
}

export const realVisionProvider = new RealVisionProvider()
