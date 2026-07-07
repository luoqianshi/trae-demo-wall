import { useCallback, useEffect, useRef, useState } from 'react'

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isSupported] = useState(typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia))
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  const attachStream = useCallback(async () => {
    if (!isSupported) {
      setError('当前浏览器不支持摄像头能力。')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsReady(true)
      setError('')
      return true
    } catch {
      setError('未能获取摄像头权限，请检查浏览器设置后重试。')
      setIsReady(false)
      return false
    }
  }, [isSupported])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsReady(false)
  }, [])

  useEffect(() => stopStream, [stopStream])

  return {
    videoRef,
    isSupported,
    isReady,
    error,
    attachStream,
    stopStream,
  }
}
