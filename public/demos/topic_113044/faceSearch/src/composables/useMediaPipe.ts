import { ref } from 'vue'
import { FaceMesh } from '@mediapipe/face_mesh'
import { Pose } from '@mediapipe/pose'
import { Hands } from '@mediapipe/hands'
import { useEmojiStore } from '@/stores/emojiStore'

interface Landmark {
  x: number
  y: number
  z: number
}

interface PoseLandmark extends Landmark {
  visibility: number
}

interface HandLandmark extends Landmark {}

interface FaceMeshResults {
  multiFaceLandmarks: Array<Array<{ x: number; y: number; z: number }>>
}

interface PoseResults {
  poseLandmarks: Array<{ x: number; y: number; z: number; visibility: number }>
}

interface HandsResults {
  multiHandLandmarks: Array<Array<{ x: number; y: number; z: number }>>
}

export const useMediaPipe = () => {
  let faceMesh: FaceMesh | null = null
  let pose: Pose | null = null
  let hands: Hands | null = null
  let processCanvas: HTMLCanvasElement | null = null
  let processCtx: CanvasRenderingContext2D | null = null
  const isModelLoaded = ref(false)
  const loadingProgress = ref(0)
  const loadingStatus = ref('')
  
  const emojiStore = useEmojiStore()
  
  let animationFrameId: number | null = null
  let lastTime = 0
  const targetFPS = 15
  const frameInterval = 1000 / targetFPS
  
  const MODEL_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe'

  const initModels = async () => {
    loadingStatus.value = '正在加载面部模型...'
    loadingProgress.value = 10
    
    faceMesh = new FaceMesh({
      locateFile: (file: string) => `${MODEL_CDN}/face_mesh/${file}`
    })
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    
    await faceMesh.initialize()
    
    loadingStatus.value = '正在加载姿态模型...'
    loadingProgress.value = 40
    
    pose = new Pose({
      locateFile: (file: string) => `${MODEL_CDN}/pose/${file}`
    })
    
    pose.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    
    await pose.initialize()
    
    loadingStatus.value = '正在加载手部模型...'
    loadingProgress.value = 70
    
    hands = new Hands({
      locateFile: (file: string) => `${MODEL_CDN}/hands/${file}`
    })
    
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    
    await hands.initialize()
    
    processCanvas = document.createElement('canvas')
    processCtx = processCanvas.getContext('2d')
    
    loadingProgress.value = 100
    loadingStatus.value = '模型加载完成'
    isModelLoaded.value = true
  }

  const getFrameFromVideo = (video: HTMLVideoElement): HTMLCanvasElement | null => {
    if (!processCanvas || !processCtx) return null
    if (video.videoWidth === 0 || video.videoHeight === 0) return null
    if (video.readyState !== 4) return null
    
    processCanvas.width = video.videoWidth
    processCanvas.height = video.videoHeight
    
    processCtx.drawImage(video, 0, 0, processCanvas.width, processCanvas.height)
    
    return processCanvas
  }

  const calculateSmile = (landmarks: Landmark[]): number => {
    const leftCorner = landmarks[61]
    const rightCorner = landmarks[291]
    const topLip = landmarks[13]
    const bottomLip = landmarks[14]
    
    if (!leftCorner || !rightCorner || !topLip || !bottomLip) return 0
    
    const mouthWidth = Math.sqrt(
      Math.pow(rightCorner.x - leftCorner.x, 2) +
      Math.pow(rightCorner.y - leftCorner.y, 2)
    )
    
    const mouthHeight = Math.sqrt(
      Math.pow(bottomLip.x - topLip.x, 2) +
      Math.pow(bottomLip.y - topLip.y, 2)
    )
    
    if (mouthHeight === 0) return 0
    
    const ratio = mouthWidth / mouthHeight
    
    const neutralRatio = 4.0
    const maxSmileRatio = 5.5
    const smileScore = (ratio - neutralRatio) / (maxSmileRatio - neutralRatio)
    
    return Math.max(0, Math.min(smileScore, 1))
  }

  const calculateMouthOpen = (landmarks: Landmark[]): number => {
    const topLip = landmarks[13]
    const bottomLip = landmarks[14]
    const leftCorner = landmarks[61]
    const rightCorner = landmarks[291]
    
    if (!topLip || !bottomLip || !leftCorner || !rightCorner) return 0
    
    const mouthWidth = Math.sqrt(
      Math.pow(rightCorner.x - leftCorner.x, 2) +
      Math.pow(rightCorner.y - leftCorner.y, 2)
    )
    
    const mouthHeight = Math.sqrt(
      Math.pow(bottomLip.x - topLip.x, 2) +
      Math.pow(bottomLip.y - topLip.y, 2)
    )
    
    if (mouthWidth === 0) return 0
    
    const ratio = mouthHeight / mouthWidth
    
    const closedRatio = 0.1
    const openRatio = 0.4
    const openScore = (ratio - closedRatio) / (openRatio - closedRatio)
    
    return Math.max(0, Math.min(openScore, 1))
  }

  const calculateBrowHeight = (landmarks: Landmark[], left: boolean): number => {
    const browPoints = left 
      ? [105, 107, 108]
      : [334, 336, 337]
    
    const eyePoints = left
      ? [159, 145]
      : [386, 374]
    
    const validBrowPoints = browPoints.map(idx => landmarks[idx]).filter(Boolean)
    const validEyePoints = eyePoints.map(idx => landmarks[idx]).filter(Boolean)
    
    if (validBrowPoints.length === 0 || validEyePoints.length === 0) return 0
    
    const avgBrowY = validBrowPoints.reduce((sum, lm) => sum + lm!.y, 0) / validBrowPoints.length
    const avgEyeY = validEyePoints.reduce((sum, lm) => sum + lm!.y, 0) / validEyePoints.length
    
    const distance = avgEyeY - avgBrowY
    
    const neutralDistance = 0.04
    const raisedDistance = 0.06
    const browScore = (distance - neutralDistance) / (raisedDistance - neutralDistance)
    
    return Math.max(0, Math.min(browScore, 1))
  }

  const calculateHeadTilt = (landmarks: Landmark[]): number => {
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    const nose = landmarks[1]
    
    if (!leftEye || !rightEye || !nose) return 0
    
    const eyeCenterX = (leftEye.x + rightEye.x) / 2
    const eyeCenterY = (leftEye.y + rightEye.y) / 2
    
    const deltaX = nose.x - eyeCenterX
    const deltaY = nose.y - eyeCenterY
    
    const tiltAngle = Math.atan2(deltaY, deltaX)
    
    return Math.max(-1, Math.min(tiltAngle * 3, 1))
  }

  const calculateBodyTilt = (landmarks: PoseLandmark[]): number => {
    if (landmarks.length < 13) return 0
    
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    
    if (!leftShoulder || !rightShoulder) return 0
    if ((leftShoulder.visibility ?? 0) < 0.5 || (rightShoulder.visibility ?? 0) < 0.5) return 0
    
    const shoulderDiffY = rightShoulder.y - leftShoulder.y
    const shoulderDiffX = rightShoulder.x - leftShoulder.x
    
    const tiltAngle = Math.atan2(shoulderDiffY, shoulderDiffX)
    
    return Math.max(-1, Math.min(tiltAngle * 2, 1))
  }

  const calculateFingerOpen = (landmarks: Landmark[], fingerStart: number): number => {
    const wrist = landmarks[0]
    const fingerTip = landmarks[fingerStart + 3]
    const fingerBase = landmarks[fingerStart]
    
    if (!wrist || !fingerTip || !fingerBase) return 0
    
    const tipToWrist = Math.sqrt(
      Math.pow(fingerTip.x - wrist.x, 2) +
      Math.pow(fingerTip.y - wrist.y, 2)
    )
    
    const baseToWrist = Math.sqrt(
      Math.pow(fingerBase.x - wrist.x, 2) +
      Math.pow(fingerBase.y - wrist.y, 2)
    )
    
    if (baseToWrist === 0) return 0
    
    const ratio = tipToWrist / baseToWrist
    
    const closedRatio = 1.0
    const openRatio = 1.5
    const openScore = (ratio - closedRatio) / (openRatio - closedRatio)
    
    return Math.max(0, Math.min(openScore, 1))
  }

  const calculateThumbOpen = (landmarks: Landmark[]): number => {
    const wrist = landmarks[0]
    const thumbTip = landmarks[4]
    const thumbBase = landmarks[2]
    const indexBase = landmarks[5]
    
    if (!wrist || !thumbTip || !thumbBase || !indexBase) return 0
    
    const thumbToIndex = Math.sqrt(
      Math.pow(thumbTip.x - indexBase.x, 2) +
      Math.pow(thumbTip.y - indexBase.y, 2)
    )
    
    const baseToIndex = Math.sqrt(
      Math.pow(thumbBase.x - indexBase.x, 2) +
      Math.pow(thumbBase.y - indexBase.y, 2)
    )
    
    if (baseToIndex === 0) return 0
    
    const ratio = thumbToIndex / baseToIndex
    
    const closedRatio = 0.8
    const openRatio = 1.5
    const openScore = (ratio - closedRatio) / (openRatio - closedRatio)
    
    return Math.max(0, Math.min(openScore, 1))
  }

  const processFaceResults = (results: FaceMeshResults) => {
    const faceLandmarks: Landmark[] = []
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0]
      for (const lm of landmarks) {
        faceLandmarks.push({
          x: lm.x,
          y: lm.y,
          z: lm.z
        })
      }
      
      const smile = calculateSmile(faceLandmarks)
      const mouthOpen = calculateMouthOpen(faceLandmarks)
      const leftBrow = calculateBrowHeight(faceLandmarks, true)
      const rightBrow = calculateBrowHeight(faceLandmarks, false)
      const headTilt = calculateHeadTilt(faceLandmarks)
      
      emojiStore.updateFeatureVector({
        smile,
        mouthOpen,
        leftBrow,
        rightBrow,
        headTilt
      })
    }
    
    emojiStore.updateFaceLandmarks(faceLandmarks)
  }

  const processPoseResults = (results: PoseResults) => {
    const poseLandmarks: PoseLandmark[] = []
    
    if (results.poseLandmarks) {
      for (const lm of results.poseLandmarks) {
        poseLandmarks.push({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 0
        })
      }
      
      const bodyTilt = calculateBodyTilt(poseLandmarks)
      
      emojiStore.updateFeatureVector({
        bodyTilt
      })
    }
    
    emojiStore.updatePoseLandmarks(poseLandmarks)
  }

  const processHandsResults = (results: HandsResults) => {
    const allHandLandmarks: HandLandmark[] = []
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      for (const lm of landmarks) {
        allHandLandmarks.push({
          x: lm.x,
          y: lm.y,
          z: lm.z
        })
      }
      
      const thumb = calculateThumbOpen(allHandLandmarks)
      const indexFinger = calculateFingerOpen(allHandLandmarks, 5)
      const middleFinger = calculateFingerOpen(allHandLandmarks, 9)
      const ringFinger = calculateFingerOpen(allHandLandmarks, 13)
      const pinkyFinger = calculateFingerOpen(allHandLandmarks, 17)
      
      emojiStore.updateFeatureVector({
        thumb,
        indexFinger,
        middleFinger,
        ringFinger,
        pinkyFinger
      })
    } else {
      emojiStore.updateFeatureVector({
        thumb: 0,
        indexFinger: 0,
        middleFinger: 0,
        ringFinger: 0,
        pinkyFinger: 0
      })
    }
    
    emojiStore.updateHandLandmarks(allHandLandmarks)
  }

  const runInference = async (videoElement: HTMLVideoElement) => {
    if (!faceMesh || !pose || !hands || !isModelLoaded.value) return
    
    const currentTime = performance.now()
    if (currentTime - lastTime < frameInterval) {
      animationFrameId = requestAnimationFrame(() => runInference(videoElement))
      return
    }
    lastTime = currentTime
    
    try {
      const frame = getFrameFromVideo(videoElement)
      if (!frame) {
        animationFrameId = requestAnimationFrame(() => runInference(videoElement))
        return
      }
      
      emojiStore.setDetecting(true)
      
      await faceMesh.send({ image: frame })
      await pose.send({ image: frame })
      await hands.send({ image: frame })
      
    } catch (error) {
      console.error('推理失败:', error)
    }
    
    animationFrameId = requestAnimationFrame(() => runInference(videoElement))
  }

  const setupCallbacks = () => {
    if (!faceMesh || !pose || !hands) return
    
    faceMesh.onResults((results) => {
      processFaceResults(results as FaceMeshResults)
    })
    
    pose.onResults((results) => {
      processPoseResults(results as PoseResults)
    })
    
    hands.onResults((results) => {
      processHandsResults(results as HandsResults)
    })
  }

  const startDetection = (videoElement: HTMLVideoElement) => {
    if (animationFrameId) return
    setupCallbacks()
    runInference(videoElement)
  }

  const stopDetection = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    emojiStore.setDetecting(false)
  }

  const extractFeaturesFromLandmarks = (faceLandmarks: Landmark[], poseLandmarks: PoseLandmark[], handLandmarks: HandLandmark[]): number[] => {
    const features: number[] = []
    
    if (faceLandmarks.length > 0) {
      features.push(calculateSmile(faceLandmarks))
      features.push(calculateMouthOpen(faceLandmarks))
      features.push(calculateBrowHeight(faceLandmarks, true))
      features.push(calculateBrowHeight(faceLandmarks, false))
      features.push(calculateHeadTilt(faceLandmarks))
    } else {
      features.push(0, 0, 0, 0, 0)
    }
    
    if (poseLandmarks.length >= 13) {
      features.push(calculateBodyTilt(poseLandmarks))
    } else {
      features.push(0)
    }
    
    if (handLandmarks.length > 0) {
      features.push(calculateThumbOpen(handLandmarks))
      features.push(calculateFingerOpen(handLandmarks, 5))
      features.push(calculateFingerOpen(handLandmarks, 9))
      features.push(calculateFingerOpen(handLandmarks, 13))
      features.push(calculateFingerOpen(handLandmarks, 17))
    } else {
      features.push(0, 0, 0, 0, 0)
    }
    
    return features
  }

  const processImageForFeatures = async (imageElement: HTMLImageElement): Promise<number[]> => {
    if (!faceMesh || !pose || !hands || !isModelLoaded.value) {
      return []
    }
    
    const faceLandmarks: Landmark[] = []
    const poseLandmarks: PoseLandmark[] = []
    const handLandmarks: HandLandmark[] = []
    
    let faceResolved = false
    let poseResolved = false
    let handsResolved = false
    
    const processAndResolveFace = (results: unknown) => {
      const r = results as FaceMeshResults
      processFaceResults(r)
      if (!faceResolved) {
        faceResolved = true
        if (r.multiFaceLandmarks && r.multiFaceLandmarks.length > 0) {
          for (const lm of r.multiFaceLandmarks[0]) {
            faceLandmarks.push({ x: lm.x, y: lm.y, z: lm.z })
          }
        }
      }
    }
    
    const processAndResolvePose = (results: unknown) => {
      const r = results as PoseResults
      processPoseResults(r)
      if (!poseResolved) {
        poseResolved = true
        if (r.poseLandmarks) {
          for (const lm of r.poseLandmarks) {
            poseLandmarks.push({ 
              x: lm.x, 
              y: lm.y, 
              z: lm.z, 
              visibility: lm.visibility ?? 0 
            })
          }
        }
      }
    }
    
    const processAndResolveHands = (results: unknown) => {
      const r = results as HandsResults
      processHandsResults(r)
      if (!handsResolved) {
        handsResolved = true
        if (r.multiHandLandmarks && r.multiHandLandmarks.length > 0) {
          for (const lm of r.multiHandLandmarks[0]) {
            handLandmarks.push({ x: lm.x, y: lm.y, z: lm.z })
          }
        }
      }
    }
    
    faceMesh.onResults(processAndResolveFace)
    pose.onResults(processAndResolvePose)
    hands.onResults(processAndResolveHands)
    
    faceMesh.send({ image: imageElement })
    pose.send({ image: imageElement })
    hands.send({ image: imageElement })
    
    const waitForAll = () => {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (faceResolved && poseResolved && handsResolved) {
            resolve()
          } else {
            setTimeout(check, 50)
          }
        }
        check()
      })
    }
    
    try {
      await waitForAll()
    } catch (error) {
      console.error('图片特征提取失败:', error)
    }
    
    return extractFeaturesFromLandmarks(faceLandmarks, poseLandmarks, handLandmarks)
  }

  const dispose = () => {
    stopDetection()
    faceMesh?.close()
    pose?.close()
    hands?.close()
    faceMesh = null
    pose = null
    hands = null
    processCanvas = null
    processCtx = null
    isModelLoaded.value = false
    loadingProgress.value = 0
    loadingStatus.value = ''
  }

  return {
    isModelLoaded,
    loadingProgress,
    loadingStatus,
    initModels,
    startDetection,
    stopDetection,
    dispose,
    processImageForFeatures
  }
}