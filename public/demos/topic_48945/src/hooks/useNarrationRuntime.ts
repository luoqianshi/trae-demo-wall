import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { appConfig } from '@/config/appConfig'
import { useFrameCapture } from '@/hooks/useFrameCapture'
import {
  evaluateNarrationDecision,
  initialNarrationDecisionState,
} from '@/services/narration/decisionEngine'
import { describeFrameWithMode } from '@/services/vision/providerAdapter'
import type { FramePayload } from '@/services/vision/types'
import { useSoundPupilStore } from '@/store/useSoundPupilStore'
import type { VisionConfigStatus } from '../../shared/vision-config'

interface UseNarrationRuntimeOptions {
  videoRef: RefObject<HTMLVideoElement>
  attachStream: () => Promise<boolean>
  isReady: boolean
  cameraError: string
  speechSupported: boolean
  speak: (text: string) => boolean
  cancel: () => void
  isConfigured: boolean
  configStatus: VisionConfigStatus
}

function getSuppressedMessage(reason: ReturnType<typeof evaluateNarrationDecision>['reason']) {
  if (reason === 'duplicate') {
    return '本轮采样与刚才内容相近，已跳过重复播报。'
  }

  if (reason === 'quiet_mode_gated') {
    return '当前处于安静模式，普通环境变化已收起，仅保留高风险与关键节点提醒。'
  }

  if (reason === 'medium_priority_gated') {
    return '本轮采样存在中等风险线索，但可信度不足，暂不播报。'
  }

  return '本轮采样未发现值得立即播报的新变化，继续安静采样。'
}

export function useNarrationRuntime({
  videoRef,
  attachStream,
  isReady,
  cameraError,
  speechSupported,
  speak,
  cancel,
  isConfigured,
  configStatus,
}: UseNarrationRuntimeOptions) {
  const decisionStateRef = useRef(initialNarrationDecisionState)
  const {
    mode,
    narrationIntensity,
    speechEnabled,
    setCameraReady,
    setRunning,
    setSpeaking,
    setMode,
    setNarrationIntensity,
    setServiceStatus,
    setRealConfigStatus,
    setNarration,
    setCountdown,
    setStatusMessage,
    setErrorMessage,
  } = useSoundPupilStore()

  const handleFrame = useCallback(
    async (frame: FramePayload) => {
      setStatusMessage('声瞳正在采样并理解你眼前的环境。')
      const { result, fallbackUsed, status } = await describeFrameWithMode(frame, mode)
      const decision = evaluateNarrationDecision(result, decisionStateRef.current, result.capturedAt, {
        intensity: narrationIntensity,
      })

      decisionStateRef.current = decision.state
      setNarration(decision.result)

      if (status === 'real') {
        setServiceStatus('online')
      } else if (status === 'fallback') {
        setMode('mock')
        setServiceStatus('degraded')
      } else {
        setServiceStatus('simulation')
      }

      if (decision.shouldAnnounce) {
        const announcementMessage =
          status === 'fallback'
            ? '真实服务暂不可用，已切换到模拟模式；本轮识别到值得立即播报的前方信息。'
            : status === 'unconfigured'
              ? '真实识别尚未配置，系统已使用模拟模式直接描述前方环境。'
              : '本轮采样识别到值得播报的前方信息，已准备语音提醒。'

        setStatusMessage(announcementMessage)

        if (speechEnabled && speechSupported) {
          speak(decision.result.text)
        }

        return
      }

      const suppressedMessage = getSuppressedMessage(decision.reason)
      setStatusMessage(
        status === 'fallback'
          ? `真实服务暂不可用，已切换到模拟模式；${suppressedMessage}`
          : status === 'unconfigured'
            ? `真实识别尚未配置，当前以模拟模式运行；${suppressedMessage}`
            : suppressedMessage,
      )
    },
    [mode, narrationIntensity, setMode, setNarration, setServiceStatus, setStatusMessage, speak, speechEnabled, speechSupported],
  )

  const { startCapture, stopCapture } = useFrameCapture(videoRef, handleFrame, setCountdown)

  const handleEnableCamera = useCallback(async () => {
    const success = await attachStream()
    setCameraReady(success)
    setErrorMessage(success ? '' : '摄像头授权失败，无法开始实时解说。')
    setStatusMessage(success ? '摄像头已就绪，可以开始连续播报。' : '请先允许摄像头权限。')
  }, [attachStream, setCameraReady, setErrorMessage, setStatusMessage])

  const handleStart = useCallback(async () => {
    const ready = isReady ? true : await attachStream()

    setCameraReady(ready)

    if (!ready) {
      setErrorMessage('摄像头授权失败，无法开始实时解说。')
      setStatusMessage('请先允许摄像头权限。')
      return
    }

    setErrorMessage('')
    setRunning(true)
    decisionStateRef.current = initialNarrationDecisionState
    setServiceStatus(mode === 'real' && isConfigured ? 'online' : 'simulation')
    setStatusMessage('声瞳已开始固定采样，并会在值得提醒时自动播报周围环境。')
    startCapture()

    if (speechEnabled && speechSupported) {
      speak('声瞳已开始固定采样，并会在值得提醒时自动播报周围环境。')
    }
  }, [attachStream, isConfigured, isReady, mode, setCameraReady, setErrorMessage, setRunning, setServiceStatus, setStatusMessage, speak, speechEnabled, speechSupported, startCapture])

  const handlePause = useCallback(() => {
    stopCapture()
    cancel()
    decisionStateRef.current = initialNarrationDecisionState
    setRunning(false)
    setSpeaking(false)
    setCountdown(Math.ceil(appConfig.narrationIntervalMs / 1000))
    setStatusMessage('播报已暂停，等待你再次开始。')
  }, [cancel, setCountdown, setRunning, setSpeaking, setStatusMessage, stopCapture])

  const handleToggleIntensity = useCallback(() => {
    const nextValue = narrationIntensity === 'standard' ? 'quiet' : 'standard'
    setNarrationIntensity(nextValue)
    setStatusMessage(
      nextValue === 'quiet'
        ? '已切换到安静模式，仅保留高风险与关键节点播报。'
        : '已恢复标准播报，会继续提醒新的环境变化。',
    )
  }, [narrationIntensity, setNarrationIntensity, setStatusMessage])

  const handleToggleMode = useCallback(() => {
    if (mode === 'mock') {
      if (!isConfigured || (configStatus !== 'saved' && configStatus !== 'valid')) {
        setServiceStatus('simulation')
        setStatusMessage('请先在真实识别设置中填写配置并测试连接。')
        return
      }

      setMode('real')
      setServiceStatus('online')
      setStatusMessage('已切换到在线优先模式，识别失败时会明确提示并降级。')
      return
    }

    setMode('mock')
    setServiceStatus('simulation')
    setStatusMessage('已切换到模拟稳定模式，优先保证连续播报。')
  }, [configStatus, isConfigured, mode, setMode, setServiceStatus, setStatusMessage])

  useEffect(() => {
    setMode(appConfig.defaultMode)
    setServiceStatus(appConfig.defaultMode === 'real' && isConfigured ? 'online' : 'simulation')
  }, [isConfigured, setMode, setServiceStatus])

  useEffect(() => {
    setRealConfigStatus(configStatus)
  }, [configStatus, setRealConfigStatus])

  useEffect(() => {
    setCameraReady(isReady)
  }, [isReady, setCameraReady])

  useEffect(() => {
    setErrorMessage(cameraError)
  }, [cameraError, setErrorMessage])

  return {
    handleEnableCamera,
    handleStart,
    handlePause,
    handleToggleIntensity,
    handleToggleMode,
  }
}
