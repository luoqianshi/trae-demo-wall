/** 3D 视口：渲染场景、相机、灯光、网格、变换控件，并提供截图能力。 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, TransformControls, PerspectiveCamera } from '@react-three/drei'
import type { DirectorStageCamera, DirectorStageElement, DirectorStageSceneData } from '../../types'
import { GeometryElement } from './elements/GeometryElement'
import { AiSceneElement } from './elements/AiSceneElement'
import { ArmyElement } from './elements/ArmyElement'

interface ScreenshotCaptureProps {
  onReady: (ready: boolean) => void
  onInit: (gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void
}

function ScreenshotCapture({ onReady, onInit }: ScreenshotCaptureProps) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    onInit(gl, scene, camera)
    onReady(true)

    const handleContextLost = () => {
      console.warn('WebGL context lost')
      onReady(false)
    }
    const handleContextRestored = () => {
      console.warn('WebGL context restored')
      onReady(true)
    }

    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      onReady(false)
    }
  }, [gl, scene, camera, onInit, onReady])

  return null
}

interface Viewport3DProps {
  sceneData: DirectorStageSceneData
  selectedIds: string[]
  selectedType: 'element' | 'camera' | null
  transformMode: 'translate' | 'rotate' | 'scale'
  viewMode: 'director' | 'camera'
  activeCameraId: string | null
  onSelect: (id: string | null, type: 'element' | 'camera' | null) => void
  onUpdateElement: (id: string, patch: Partial<DirectorStageElement>) => void
  onUpdateCamera: (id: string, patch: Partial<DirectorStageCamera>) => void
  onReady?: (ready: boolean) => void
}

const ASPECT_TO_SIZE: Record<string, { width: number; height: number }> = {
  '16:9': { width: 2560, height: 1440 },
  '9:16': { width: 1440, height: 2560 },
  '4:3': { width: 2048, height: 1536 },
  '1:1': { width: 1024, height: 1024 },
}

function CameraController({ viewMode, activeCamera }: { viewMode: 'director' | 'camera'; activeCamera: DirectorStageCamera | null }) {
  const { camera, controls } = useThree()
  const initialSet = useRef(false)
  const controlsReadyRef = useRef(false)

  useEffect(() => {
    const orbit = controls as any
    if (viewMode === 'camera' && activeCamera) {
      const [px, py, pz] = activeCamera.position
      const [tx, ty, tz] = activeCamera.target
      camera.position.set(px, py, pz)
      camera.lookAt(tx, ty, tz)
      if (orbit && orbit.target) {
        orbit.target.set(tx, ty, tz)
        orbit.update()
      }
      if ('fov' in camera && activeCamera.fov) {
        (camera as THREE.PerspectiveCamera).fov = activeCamera.fov
        camera.updateProjectionMatrix()
      }
      return
    }

    // 导演视角初始位置：模型正对用户（相机位于正前方）
    // 分两次确保：controls 未就绪时先设置 camera，controls 就绪后再同步 target
    if (!initialSet.current) {
      camera.position.set(0, 1.4, 4)
      camera.lookAt(0, 1, 0)
      initialSet.current = true
    }
    if (orbit && orbit.target && !controlsReadyRef.current) {
      orbit.target.set(0, 1, 0)
      orbit.update()
      controlsReadyRef.current = true
    }
  }, [camera, controls, viewMode, activeCamera])

  return null
}

function CameraHelperVisual({ camera }: { camera: DirectorStageCamera }) {
  // 用 useState 持有 helper 实例，赋值后触发重渲染，确保 <primitive> 能拿到它。
  // 修复原 ref 写法：ref 变化不触发重渲染，helper 永远为 null、辅助框不显示。
  const [helper, setHelper] = useState<THREE.CameraHelper | null>(null)

  useEffect(() => {
    const [aW, aH] = camera.aspect.split(':').map(Number)
    const cam = new THREE.PerspectiveCamera(camera.fov, aW / aH, 0.1, 100)
    const [px, py, pz] = camera.position
    const [tx, ty, tz] = camera.target
    cam.position.set(px, py, pz)
    cam.lookAt(tx, ty, tz)
    cam.updateProjectionMatrix()
    const h = new THREE.CameraHelper(cam)
    setHelper(h)
    return () => {
      h.dispose()
      setHelper(null)
    }
  }, [camera])

  if (!helper) return null
  return <primitive object={helper} />
}

function SafeFrame({ aspect }: { aspect: string }) {
  // 在导演视角下给当前活动机位画一个安全框提示
  const { viewport } = useThree()
  const [w, h] = useMemo(() => {
    const [aW, aH] = aspect.split(':').map(Number)
    const targetRatio = aW / aH
    const vpRatio = viewport.width / viewport.height
    let width: number
    let height: number
    if (targetRatio > vpRatio) {
      width = viewport.width * 0.9
      height = width / targetRatio
    } else {
      height = viewport.height * 0.9
      width = height * targetRatio
    }
    return [width, height]
  }, [aspect, viewport.width, viewport.height])

  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.PlaneGeometry(w, h)]} />
      <lineBasicMaterial color="#f59e0b" transparent opacity={0.5} />
    </lineSegments>
  )
}

function SceneContent({
  sceneData,
  selectedIds,
  selectedType,
  transformMode,
  viewMode,
  activeCamera,
  onSelect,
  onUpdateElement,
  elementRefs,
}: {
  sceneData: DirectorStageSceneData
  selectedIds: string[]
  selectedType: 'element' | 'camera' | null
  transformMode: 'translate' | 'rotate' | 'scale'
  viewMode: 'director' | 'camera'
  activeCamera: DirectorStageCamera | null
  onSelect: (id: string | null, type: 'element' | 'camera' | null) => void
  onUpdateElement: (id: string, patch: Partial<DirectorStageElement>) => void
  elementRefs: React.MutableRefObject<Map<string, THREE.Object3D>>
}) {
  const handleElementClick = useCallback((e: any, id: string) => {
    e.stopPropagation()
    onSelect(id, 'element')
  }, [onSelect])

  const handleBgClick = useCallback(() => {
    onSelect(null, null)
  }, [onSelect])

  // 区分 click 与 drag：pointer down 时记录位置，移动超过阈值则不视为点击
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)

  const handlePointerDown = useCallback((e: any) => {
    pointerDownRef.current = { x: e.offsetX, y: e.offsetY }
    isDraggingRef.current = false
  }, [])

  const handlePointerMove = useCallback((e: any) => {
    if (!pointerDownRef.current) return
    const dx = e.offsetX - pointerDownRef.current.x
    const dy = e.offsetY - pointerDownRef.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      isDraggingRef.current = true
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    pointerDownRef.current = null
  }, [])

  const handleBgClickIfNotDrag = useCallback(() => {
    if (!isDraggingRef.current) {
      handleBgClick()
    }
  }, [handleBgClick])

  const transformRef = useRef<any>(null)

  // 代理 Object3D：TransformControls 绑定它，让 gizmo 显示在物体底部中心下方
  // 而非 object 原点。拖动代理时实时同步到真实物体（只改 Object3D，不调 setSceneData，
  // 避免触发重渲染导致 Html 重挂消失）
  const proxyObject = useMemo(() => new THREE.Object3D(), [])
  const bottomYRef = useRef(0)
  const initialProxyMatrix = useRef(new THREE.Matrix4())

  // 隐藏 TransformControls 的多轴平面/区域（XY/YZ/XZ/XYZ/XYZE），
  // 只保留单轴箭头，确保拖动时只沿选中轴移动，不会同时改变多个轴。
  useEffect(() => {
    const tc = transformRef.current
    if (!tc) return
    const MULTI_AXIS_NAMES = new Set(['XY', 'YZ', 'XZ', 'XYZ', 'XYZE'])
    ;[tc.gizmo, tc.picker, tc.helper].forEach(obj => {
      if (!obj) return
      obj.traverse((child: THREE.Object3D) => {
        if (child.name && MULTI_AXIS_NAMES.has(child.name)) {
          child.visible = false
        }
      })
    })
  }, [transformMode, selectedIds, selectedType])

  const selectedObjects = selectedType === 'element'
    ? selectedIds
        .map(id => {
          const obj = elementRefs.current.get(id)
          return obj ? { id, obj } : null
        })
        .filter((x): x is { id: string; obj: THREE.Object3D } => !!x)
    : []

  const selectionKey = selectedIds.join(',')

  // 选中物体变化时，初始化代理变换。单元素放在底部中心下方（同原逻辑）；
  // 多选放在所有选中对象的包围中心，整体变换时让各对象绕该中心联动。
  useEffect(() => {
    if (selectedObjects.length === 0) return
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0].obj
      obj.updateWorldMatrix(true, true)
      // army 元素含 InstancedMesh，Box3.setFromObject 会遍历所有实例（10000+）导致卡顿。
      // 直接用 group 原点为底部，跳过 Box3 计算。
      const hasInstancedMesh = obj.children.some(c => (c as any).isInstancedMesh)
      if (hasInstancedMesh) {
        bottomYRef.current = 0
        proxyObject.position.copy(obj.position)
        proxyObject.position.y -= 0.3
      } else {
        const box = new THREE.Box3().setFromObject(obj)
        const localBottomY = box.isEmpty() ? 0 : box.min.y - obj.position.y
        bottomYRef.current = localBottomY
        proxyObject.position.copy(obj.position)
        proxyObject.position.y += localBottomY - 0.3
      }
      proxyObject.rotation.set(0, 0, 0)
      proxyObject.scale.set(1, 1, 1)
      proxyObject.updateMatrixWorld()
      initialProxyMatrix.current.copy(proxyObject.matrix)
      return
    }
    // 多选：代理放在所有选中对象 position 的平均中心（避免 Box3 遍历万级实例卡顿）
    const center = new THREE.Vector3()
    selectedObjects.forEach(({ obj }) => center.add(obj.position))
    center.multiplyScalar(1 / selectedObjects.length)
    proxyObject.position.copy(center)
    proxyObject.rotation.set(0, 0, 0)
    proxyObject.scale.set(1, 1, 1)
    proxyObject.updateMatrixWorld()
    initialProxyMatrix.current.copy(proxyObject.matrix)
  }, [selectionKey, selectedType, selectedObjects, proxyObject, sceneData])

  const selectedObjectsRef = useRef(selectedObjects)
  selectedObjectsRef.current = selectedObjects

  return (
    <>
      <color attach="background" args={[sceneData.background.color || '#111111']} />
      <ambientLight intensity={sceneData.environment.ambientIntensity ?? 0.6} />
      <directionalLight position={[5, 10, 7]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />

      {sceneData.background.showGrid !== false && (
        <>
          {/* 地面参考平面：半透明深色面，让"地面"有实体感 */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color="#0a0a0a" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          {/* 线框格子：参考 LibTV 导演台，蓝色线框网格 */}
          <Grid
            position={[0, 0, 0]}
            args={[40, 40]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#1e3a5f"
            sectionSize={5}
            sectionThickness={1.2}
            sectionColor="#2e5a8a"
            fadeDistance={80}
            fadeStrength={0.8}
            infiniteGrid
          />
        </>
      )}

      {/* 场景元素 */}
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleBgClickIfNotDrag}
      >
        {sceneData.elements.map(element => {
          return (
            <group
              key={element.id}
              ref={el => {
                if (el) elementRefs.current.set(element.id, el)
                else elementRefs.current.delete(element.id)
              }}
              position={element.transform.position}
              rotation={element.transform.rotation}
              scale={element.transform.scale}
              visible={element.visible !== false}
              onClick={e => handleElementClick(e, element.id)}
            >
              {element.type === 'army' ? (
                <ArmyElement element={element} />
              ) : element.type === 'ai_object' || element.type === 'ai_scene' ? (
                <AiSceneElement element={element} />
              ) : (
                <GeometryElement element={element} />
              )}
            </group>
          )
        })}
      </group>

      {/* 机位可视化 */}
      {sceneData.cameras.map(camera => (
        <CameraHelperVisual key={camera.id} camera={camera} />
      ))}

      {/* 导演视角下的安全框 */}
      {viewMode === 'director' && activeCamera && (
        <SafeFrame aspect={activeCamera.aspect} />
      )}

      {/* 代理 Object3D 必须挂到场景图中，TransformControls 才能正确计算世界变换。
          Object3D 本身无可渲染内容，不会产生可见图形。 */}
      <primitive object={proxyObject} />

      {/* 变换控件：拖动中由 TransformControls 直接操作 Object3D，松手时再回写状态。
          不在 onObjectChange 里高频 setSceneData，否则 <Html transform> 会反复重挂导致人物闪烁/消失。 */}
      {selectedObjects.length > 0 && selectedType === 'element' && (
        <TransformControls
          ref={transformRef}
          object={proxyObject}
          mode={transformMode}
          size={0.7}
          onMouseDown={() => { isDraggingRef.current = true }}
          onObjectChange={() => {
            const objs = selectedObjectsRef.current
            if (objs.length === 0) return
            proxyObject.updateMatrix()
            if (objs.length === 1) {
              // 单元素：保持底部偏移，实时同步代理到真实物体（只改 Object3D，不调 setSceneData）
              const obj = objs[0].obj
              const yOffset = bottomYRef.current - 0.3
              obj.position.copy(proxyObject.position)
              obj.position.y -= yOffset
              obj.rotation.copy(proxyObject.rotation)
              obj.scale.copy(proxyObject.scale)
              obj.updateMatrixWorld()
              return
            }
            // 多选：用增量矩阵（= 当前代理矩阵 × 初始代理矩阵逆）应用到每个选中对象，
            // 使它们绕选中中心整体平移/旋转/缩放。
            const delta = new THREE.Matrix4().multiplyMatrices(
              proxyObject.matrix,
              initialProxyMatrix.current.clone().invert(),
            )
            objs.forEach(({ obj }) => {
              obj.updateMatrix()
              obj.matrix.premultiply(delta)
              obj.matrix.decompose(obj.position, obj.quaternion, obj.scale)
              obj.updateMatrixWorld()
            })
            initialProxyMatrix.current.copy(proxyObject.matrix)
          }}
          onMouseUp={() => {
            isDraggingRef.current = false
            const objs = selectedObjectsRef.current
            if (objs.length === 0) return
            objs.forEach(({ id, obj }) => {
              onUpdateElement(id, {
                transform: {
                  position: [obj.position.x, obj.position.y, obj.position.z],
                  rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
                  scale: [obj.scale.x, obj.scale.y, obj.scale.z],
                },
              })
            })
          }}
        />
      )}

      <OrbitControls
        makeDefault
        enableDamping={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
      />

      <CameraController viewMode={viewMode} activeCamera={activeCamera} />
    </>
  )
}

export interface Viewport3DRef {
  takeScreenshot: (aspect: string) => Promise<Blob>
  ready: boolean
}

export const Viewport3D = forwardRef<Viewport3DRef, Viewport3DProps>(
  function Viewport3D(props, ref) {
    const { sceneData, selectedIds, selectedType, transformMode, viewMode, activeCameraId, onSelect, onUpdateElement, onReady } = props
    const elementRefs = useRef(new Map<string, THREE.Object3D>())
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.Camera | null>(null)
    const [ready, setReady] = useState(false)

    const activeCamera = useMemo(() =>
      sceneData.cameras.find(cam => cam.id === activeCameraId) || null,
    [sceneData.cameras, activeCameraId])

    const handleInit = useCallback((gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
      rendererRef.current = gl
      sceneRef.current = scene
      cameraRef.current = camera
    }, [])

    const handleReady = useCallback((isReady: boolean) => {
      setReady(isReady)
      onReady?.(isReady)
    }, [onReady])

    useImperativeHandle(ref, () => ({
      get ready() { return ready },
      takeScreenshot: async (aspect: string) => {
        const renderer = rendererRef.current
        const scene = sceneRef.current
        const camera = cameraRef.current
        if (!renderer || !scene || !camera) {
          throw new Error('3D 渲染器未就绪')
        }

        const size = ASPECT_TO_SIZE[aspect] || ASPECT_TO_SIZE['16:9']
        const originalSize = renderer.getSize(new THREE.Vector2())
        const originalPixelRatio = renderer.getPixelRatio()

        // 截图相机：有活动机位用其参数；否则用当前视口相机（导演自由视角）的实时位姿。
        const shotCamera = (camera as THREE.PerspectiveCamera).clone()
        if (activeCamera) {
          const [px, py, pz] = activeCamera.position
          const [tx, ty, tz] = activeCamera.target
          shotCamera.position.set(px, py, pz)
          shotCamera.lookAt(tx, ty, tz)
          shotCamera.fov = activeCamera.fov
        }
        const [aW, aH] = (activeCamera ? activeCamera.aspect : aspect).split(':').map(Number)
        shotCamera.aspect = aW / aH
        shotCamera.updateProjectionMatrix()

        // 用目标分辨率渲染（preserveDrawingBuffer:true 已开启，可直接抓当前帧）。
        renderer.setPixelRatio(1)
        renderer.setSize(size.width, size.height, false)
        renderer.render(scene, shotCamera)

        // 直抓 drawingBuffer，去掉原 WebGLRenderTarget + 逐像素翻转。
        const blob = await new Promise<Blob>((resolve, reject) => {
          renderer.domElement.toBlob(b => {
            if (b) resolve(b)
            else reject(new Error('截图生成 Blob 失败'))
          }, 'image/png')
        })

        // 还原视口尺寸与画面
        renderer.setPixelRatio(originalPixelRatio)
        renderer.setSize(originalSize.x, originalSize.y, false)
        renderer.render(scene, camera)
        return blob
      },
    }), [activeCamera, ready])

    const defaultCamera = useMemo(() => ({ position: [5, 4, 7] as [number, number, number], fov: 50, near: 0.1, far: 200 }), [])

    return (
      <Canvas
        className="w-full h-full"
        camera={defaultCamera}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <ScreenshotCapture onInit={handleInit} onReady={handleReady} />
        <SceneContent
          sceneData={sceneData}
          selectedIds={selectedIds}
          selectedType={selectedType}
          transformMode={transformMode}
          viewMode={viewMode}
          activeCamera={activeCamera}
          onSelect={onSelect}
          onUpdateElement={onUpdateElement}
          elementRefs={elementRefs}
        />
      </Canvas>
    )
  },
)
