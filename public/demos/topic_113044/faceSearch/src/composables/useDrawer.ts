import { useEmojiStore } from '@/stores/emojiStore'

interface FaceLandmark {
  x: number
  y: number
  z: number
}

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

const LEFT_EYE = [33, 160, 158, 133, 153, 144]
const RIGHT_EYE = [362, 385, 387, 263, 373, 380]
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 61]
const LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 291, 78]
const LEFT_BROW = [105, 67, 103, 54, 109]
const RIGHT_BROW = [334, 296, 336, 293, 340]

const POSE_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16]
]

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20]
]

interface ViewportMapping {
  offsetX: number
  offsetY: number
  scale: number
}

export const useDrawer = () => {
  const emojiStore = useEmojiStore()
  
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null
  let animationFrameId: number | null = null
  let mapping: ViewportMapping = {
    offsetX: 0,
    offsetY: 0,
    scale: 1
  }
  let videoWidth = 0
  let videoHeight = 0

  const setCanvas = (canvasElement: HTMLCanvasElement) => {
    canvas = canvasElement
    ctx = canvasElement.getContext('2d')
  }

  const syncCanvasSize = (videoElement: HTMLVideoElement) => {
    if (!canvas) return
    
    const rect = videoElement.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    videoWidth = videoElement.videoWidth || 640
    videoHeight = videoElement.videoHeight || 480
    
    updateMapping(rect.width, rect.height)
  }

  const updateMapping = (displayWidth: number, displayHeight: number) => {
    if (!videoWidth || !videoHeight) {
      mapping = { offsetX: 0, offsetY: 0, scale: 1 }
      return
    }
    
    const videoAspect = videoWidth / videoHeight
    const displayAspect = displayWidth / displayHeight
    
    let scale: number
    let offsetX = 0
    let offsetY = 0
    
    if (videoAspect > displayAspect) {
      scale = displayHeight / videoHeight
      offsetX = (displayWidth - videoWidth * scale) / 2
    } else {
      scale = displayWidth / videoWidth
      offsetY = (displayHeight - videoHeight * scale) / 2
    }
    
    mapping = { offsetX, offsetY, scale }
  }

  const mapToDisplay = (x: number, y: number) => {
    return {
      x: x * videoWidth * mapping.scale + mapping.offsetX,
      y: y * videoHeight * mapping.scale + mapping.offsetY
    }
  }

  const drawPoint = (x: number, y: number, color: string, size: number = 2) => {
    if (!ctx) return
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, lineWidth: number = 2) => {
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }

  const drawFaceLandmarks = (landmarks: FaceLandmark[]) => {
    if (!ctx || landmarks.length === 0) return

    for (const lm of landmarks) {
      const mapped = mapToDisplay(lm.x, lm.y)
      drawPoint(mapped.x, mapped.y, '#00ff00', 2)
    }
  }

  const drawFaceContours = (landmarks: FaceLandmark[]) => {
    if (!ctx || landmarks.length === 0) return

    const drawContour = (indices: number[], color: string) => {
      ctx!.beginPath()
      ctx!.strokeStyle = color
      ctx!.lineWidth = 2
      
      const firstIdx = indices[0]
      const firstLm = landmarks[firstIdx]
      const firstMapped = mapToDisplay(firstLm.x, firstLm.y)
      ctx!.moveTo(firstMapped.x, firstMapped.y)
      
      for (let i = 1; i < indices.length; i++) {
        const lm = landmarks[indices[i]]
        const mapped = mapToDisplay(lm.x, lm.y)
        ctx!.lineTo(mapped.x, mapped.y)
      }
      
      ctx!.stroke()
    }

    drawContour(LEFT_EYE, '#00ffff')
    drawContour(RIGHT_EYE, '#00ffff')
    drawContour(LIPS_OUTER, '#ff69b4')
    drawContour(LIPS_INNER, '#ff1493')
    drawContour(LEFT_BROW, '#ffff00')
    drawContour(RIGHT_BROW, '#ffff00')
  }

  const drawPoseSkeleton = (landmarks: PoseLandmark[]) => {
    if (!ctx || landmarks.length === 0) return

    for (const connection of POSE_CONNECTIONS) {
      const [startIdx, endIdx] = connection
      const startLm = landmarks[startIdx]
      const endLm = landmarks[endIdx]
      
      if (!startLm || !endLm) continue
      if (startLm.visibility < 0.5 || endLm.visibility < 0.5) continue
      
      const mapped1 = mapToDisplay(startLm.x, startLm.y)
      const mapped2 = mapToDisplay(endLm.x, endLm.y)
      
      drawLine(mapped1.x, mapped1.y, mapped2.x, mapped2.y, '#00bfff', 3)
      
      drawPoint(mapped1.x, mapped1.y, '#ff0000', 4)
      drawPoint(mapped2.x, mapped2.y, '#ff0000', 4)
    }
  }

  const drawHandSkeleton = (landmarks: FaceLandmark[]) => {
    if (!ctx || landmarks.length === 0) return

    for (const connection of HAND_CONNECTIONS) {
      const [startIdx, endIdx] = connection
      const startLm = landmarks[startIdx]
      const endLm = landmarks[endIdx]
      
      if (!startLm || !endLm) continue
      
      const mapped1 = mapToDisplay(startLm.x, startLm.y)
      const mapped2 = mapToDisplay(endLm.x, endLm.y)
      
      drawLine(mapped1.x, mapped1.y, mapped2.x, mapped2.y, '#ff8c00', 2)
      
      drawPoint(mapped1.x, mapped1.y, '#ff6347', 3)
      drawPoint(mapped2.x, mapped2.y, '#ff6347', 3)
    }
  }

  const draw = () => {
    if (!ctx || !canvas) return
    
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    
    drawFaceLandmarks(emojiStore.faceLandmarks)
    drawFaceContours(emojiStore.faceLandmarks)
    drawPoseSkeleton(emojiStore.poseLandmarks)
    drawHandSkeleton(emojiStore.handLandmarks)
    
    animationFrameId = requestAnimationFrame(draw)
  }

  const startDrawing = () => {
    if (animationFrameId) return
    draw()
  }

  const stopDrawing = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    }
  }

  const dispose = () => {
    stopDrawing()
    canvas = null
    ctx = null
  }

  return {
    setCanvas,
    syncCanvasSize,
    startDrawing,
    stopDrawing,
    dispose
  }
}