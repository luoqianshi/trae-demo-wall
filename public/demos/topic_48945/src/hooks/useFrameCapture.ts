import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { appConfig } from '@/config/appConfig'
import type { FramePayload } from '@/services/vision/types'
import { createPollingController } from '@/utils/timer'

function getCaptureDimensions(videoWidth: number, videoHeight: number) {
  if (videoWidth <= appConfig.captureMaxWidth) {
    return {
      width: videoWidth,
      height: videoHeight,
    }
  }

  const scale = appConfig.captureMaxWidth / videoWidth

  return {
    width: Math.round(videoWidth * scale),
    height: Math.round(videoHeight * scale),
  }
}

export function useFrameCapture(
  videoRef: RefObject<HTMLVideoElement>,
  onFrame: (frame: FramePayload) => Promise<void>,
  onCountdown?: (secondsLeft: number) => void,
) {
  const controllerRef = useRef<ReturnType<typeof createPollingController> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const captureFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const canvas = canvasRef.current
    const { width, height } = getCaptureDimensions(video.videoWidth, video.videoHeight)
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    await onFrame({
      dataUrl: canvas.toDataURL('image/jpeg', appConfig.captureJpegQuality),
      capturedAt: Date.now(),
    })
  }, [onFrame, videoRef])

  const startCapture = useCallback(() => {
    controllerRef.current = createPollingController(
      appConfig.narrationIntervalMs,
      captureFrame,
      onCountdown,
    )

    controllerRef.current.start()
  }, [captureFrame, onCountdown])

  const stopCapture = useCallback(() => {
    controllerRef.current?.stop()
    controllerRef.current = null
  }, [])

  useEffect(() => stopCapture, [stopCapture])

  return {
    startCapture,
    stopCapture,
  }
}
