/** 士兵方阵渲染：InstancedMesh + Canvas 纹理 + Billboard。
 *  把 SVG 卡通人物绘制到 Canvas 做成贴图，一次 draw call 渲染全部士兵。
 *  Billboard 通过整体绕 Y 轴旋转实现（所有士兵朝同一方位角），零逐实例开销。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { ArmyConfig, DirectorStageElement } from '../../../types'
import { buildDancerConfig, generateSoldierSVG } from './AiSceneElement'

/** 把 SVG 卡通人物异步绘制到 Canvas → CanvasTexture。loading 期间返回 null。 */
function useSoldierTexture(config: ArmyConfig): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)
  // 颜色对象序列化做依赖 key
  const colorsKey = JSON.stringify(config.colors)

  useEffect(() => {
    let cancelled = false
    const dancer = buildDancerConfig(config.pose, config.isWoman, config.colors)
    const svg = generateSoldierSVG(dancer, config.isWoman)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      // Canvas 与 SVG viewBox 同尺寸 180×330，保证比例一致
      const canvas = document.createElement('canvas')
      canvas.width = 180
      canvas.height = 330
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, 180, 330)
      ctx.drawImage(img, 0, 0, 180, 330)
      const tex = new THREE.CanvasTexture(canvas)
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.anisotropy = 8
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      setTexture(tex)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      console.error('士兵纹理加载失败')
      URL.revokeObjectURL(url)
    }
    img.src = url
    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.pose, config.isWoman, colorsKey])

  // 卸载时 dispose
  useEffect(() => () => { texture?.dispose() }, [texture])
  return texture
}

/** 计算所有士兵位置：方阵按 sqrt 排成网格，整体居中。 */
function computeArmyPositions(config: ArmyConfig): THREE.Vector3[] {
  const { rows, cols, formations, spacing, formationGap } = config
  const gap = formationGap * spacing // 方阵间距（米）
  const positions: THREE.Vector3[] = []

  const formationsPerRow = Math.ceil(Math.sqrt(formations))
  const formationsPerCol = Math.ceil(formations / formationsPerRow)

  // 单方阵宽深
  const blockW = (cols - 1) * spacing
  const blockD = (rows - 1) * spacing
  // 整体宽深（含方阵间隔）
  const totalW = formationsPerRow * blockW + (formationsPerRow - 1) * gap
  const totalD = formationsPerCol * blockD + (formationsPerCol - 1) * gap

  for (let f = 0; f < formations; f++) {
    const fx = f % formationsPerRow
    const fz = Math.floor(f / formationsPerRow)
    const startX = -totalW / 2 + fx * (blockW + gap)
    const startZ = -totalD / 2 + fz * (blockD + gap)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push(new THREE.Vector3(
          startX + c * spacing,
          0,
          startZ + r * spacing,
        ))
      }
    }
  }
  return positions
}

export function ArmyElement({ element }: { element: DirectorStageElement }) {
  const config = element.army!
  const texture = useSoldierTexture(config)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const meshWorldPos = useMemo(() => new THREE.Vector3(), [])

  const positions = useMemo(
    () => computeArmyPositions(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.rows, config.cols, config.formations, config.spacing, config.formationGap],
  )

  // 初始化 / config 变化时重建实例矩阵。
  // 依赖 texture：texture 为 null 时组件返回空 <group />，instancedMesh 不存在，
  // meshRef.current 为 null，矩阵不会初始化；texture 就绪后 instancedMesh 才挂载，
  // 此时必须重新初始化矩阵，否则所有实例停在默认单位矩阵（原点重叠成 1 个）。
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    // planeGeometry 中心在原点，高度 1.65，故脚底在 y=-0.825（地下）。
    // 上移 0.825 让脚底贴地。
    const Y_OFFSET = 0.825
    positions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y + Y_OFFSET, pos.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [positions, dummy, texture])

  // Billboard：整个 InstancedMesh 绕 Y 朝向相机（所有士兵同一方位角，零逐实例开销）
  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.getWorldPosition(meshWorldPos)
    const dx = camera.position.x - meshWorldPos.x
    const dz = camera.position.z - meshWorldPos.z
    mesh.rotation.y = Math.atan2(dx, dz)
  })

  // loading 期间渲染空 group 占位，避免无材质崩溃
  if (!texture) return <group />

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        // count 变化时强制重建（R3F 限制：args 创建后不可变）
        key={positions.length}
        args={[undefined, undefined, positions.length]}
        frustumCulled={false}
      >
        {/* plane 0.9×1.65，比例 0.545 与 SVG viewBox 180×330 一致 */}
        <planeGeometry args={[0.9, 1.65]} />
        <meshBasicMaterial
          map={texture}
          transparent={false}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          depthWrite={true}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  )
}
