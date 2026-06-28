import { appConfig } from '@/config/appConfig'
import { readVisionConfigFromStorage } from '@/hooks/useVisionConfig'
import { mockVisionService } from '@/services/vision/mockVisionService'
import { realVisionProvider } from '@/services/vision/realVisionProvider'
import type { FramePayload, NarrationResult, VisionFallbackReason, VisionMode } from '@/services/vision/types'
import { isVisionRuntimeConfigComplete } from '../../../shared/vision-config'

export type DescribeFrameStatus = 'mock' | 'real' | 'fallback' | 'unconfigured'

function withFallbackMetadata(
  result: NarrationResult,
  reason: VisionFallbackReason,
): NarrationResult {
  return {
    ...result,
    fallback: {
      used: true,
      reason,
    },
  }
}

export async function describeFrameWithMode(
  frame: FramePayload,
  mode: VisionMode,
): Promise<{ result: NarrationResult; fallbackUsed: boolean; status: DescribeFrameStatus }> {
  const supportRealMode = isVisionRuntimeConfigComplete(readVisionConfigFromStorage())

  if (mode === 'real' && supportRealMode) {
    try {
      const result = await realVisionProvider.describeFrame(frame)
      return { result, fallbackUsed: false, status: 'real' }
    } catch (error) {
      const result = await mockVisionService.describeFrame(frame)
      const reason =
        error instanceof Error && error.message === '真实视觉服务响应格式无效'
          ? 'real_service_invalid_response'
          : error instanceof Error && error.message === '真实视觉服务调用失败'
            ? 'real_service_http_error'
            : 'real_service_unavailable'

      return {
        result: withFallbackMetadata(result, reason),
        fallbackUsed: true,
        status: 'fallback',
      }
    }
  }

  if (mode === 'real' && !supportRealMode) {
    const result = await mockVisionService.describeFrame(frame)
    return {
      result: withFallbackMetadata(result, 'real_service_unavailable'),
      fallbackUsed: true,
      status: 'unconfigured',
    }
  }

  const result = await mockVisionService.describeFrame(frame)
  return { result, fallbackUsed: false, status: 'mock' }
}
