import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line, Html, Text } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import Table3D from './Table3D.jsx'
import { getSpeedColor } from '../utils/colors.js'

/**
 * 3D球桌场景组件
 * 包含3D球桌模型和球的3D轨迹线
 * 使用@react-three/fiber和@react-three/drei
 * 轨迹颜色渐变：绿（慢）→黄（中）→红（快）
 */

// 球桌尺寸常量（单位：米）
const TABLE_LENGTH = 2.74
const TABLE_WIDTH = 1.525
const TABLE_HEIGHT = 0.76

/**
 * 将数据坐标(0-100)转换为3D场景坐标
 * @param {number} x - 数据x坐标(0-100)，球桌长度方向
 * @param {number} y - 数据y坐标(0-100)，球桌宽度方向
 * @param {number} z - 数据z坐标(0-30, cm)，高度方向
 * @returns {{x: number, y: number, z: number}} 3D坐标
 */
function dataTo3D(x, y, z = 0) {
  return {
    x: -TABLE_LENGTH / 2 + (x / 100) * TABLE_LENGTH,
    y: TABLE_HEIGHT + z / 100, // cm转m
    z: -TABLE_WIDTH / 2 + (y / 100) * TABLE_WIDTH,
  }
}

/**
 * 3D球路轨迹组件
 * @param {Array} trajectory - 3D球路轨迹数据
 * @param {Array} landingPoints - 落点数据（用于标注）
 */
function Trajectory3D({ trajectory, landingPoints = [] }) {
  // 计算轨迹点和颜色
  const { points, colors } = useMemo(() => {
    if (!trajectory || trajectory.length === 0) {
      return { points: [], colors: [] }
    }

    const pts = []
    const cols = []
    for (const point of trajectory) {
      const pos = dataTo3D(point.x, point.y, point.z || 0)
      pts.push([pos.x, pos.y, pos.z])
      cols.push(new THREE.Color(getSpeedColor(point.speed || 5)))
    }
    return { points: pts, colors: cols }
  }, [trajectory])

  if (points.length === 0) return null

  // 轨迹线分段绘制（每段一种颜色）
  const segments = []
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      start: points[i],
      end: points[i + 1],
      color: colors[i],
    })
  }

  return (
    <group>
      {/* 绘制轨迹线段 */}
      {segments.map((seg, idx) => (
        <Line
          key={idx}
          points={[seg.start, seg.end]}
          color={seg.color}
          lineWidth={2}
          transparent
          opacity={0.85}
        />
      ))}

      {/* 标注起点 */}
      <Html position={points[0]} center distanceFactor={3}>
        <div className="pp-3d-label pp-3d-label-start">起点</div>
      </Html>

      {/* 标注终点 */}
      <Html position={points[points.length - 1]} center distanceFactor={3}>
        <div className="pp-3d-label pp-3d-label-end">终点</div>
      </Html>

      {/* 标注最高点（过网点） */}
      {(() => {
        let maxZ = 0
        let maxIdx = 0
        for (let i = 0; i < trajectory.length; i++) {
          if ((trajectory[i].z || 0) > maxZ) {
            maxZ = trajectory[i].z || 0
            maxIdx = i
          }
        }
        if (maxZ > 0) {
          return (
            <Html position={points[maxIdx]} center distanceFactor={3}>
              <div className="pp-3d-label pp-3d-label-peak">
                过网 {maxZ.toFixed(1)}cm
              </div>
            </Html>
          )
        }
        return null
      })()}

      {/* 标注落点 */}
      {landingPoints.slice(0, 10).map((lp, idx) => {
        const pos = dataTo3D(lp.x, lp.y, 0)
        return (
          <group key={'landing-' + idx} position={[pos.x, TABLE_HEIGHT, pos.z]}>
            <mesh>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial
                color={lp.zone === 'left' ? '#3b82f6' : lp.zone === 'center' ? '#f59e0b' : '#ef4444'}
                emissive={lp.zone === 'left' ? '#3b82f6' : lp.zone === 'center' ? '#f59e0b' : '#ef4444'}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        )
      })}

      {/* 球的当前位置（动画球） */}
      <mesh position={points[points.length - 1]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * 3D球路轨迹主组件
 * 包含Canvas、灯光、OrbitControls
 * @param {Array} trajectory - 3D球路轨迹数据
 * @param {Array} landingPoints - 落点数据
 */
function Trajectory3DScene({ trajectory, landingPoints = [] }) {
  return (
    <div className="pp-3d-container">
      <Canvas
        camera={{ position: [3, 2.5, 2.5], fov: 50 }}
        style={{ background: '#0a1628' }}
      >
        {/* 环境光 */}
        <ambientLight intensity={0.4} />
        {/* 方向光 */}
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.3} />

        {/* 3D球桌模型 */}
        <Table3D />

        {/* 3D球路轨迹 */}
        <Trajectory3D trajectory={trajectory} landingPoints={landingPoints} />

        {/* 轨迹颜色图例 */}
        <Html position={[-2, 2, -1.5]} distanceFactor={4}>
          <div className="pp-3d-legend">
            <div className="pp-3d-legend-title">球速</div>
            <div className="pp-3d-legend-bar"></div>
            <div className="pp-3d-legend-labels">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>
        </Html>

        {/* OrbitControls让用户拖拽旋转视角 */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0.8, 0]}
        />

        {/* 网格地面 */}
        <gridHelper args={[6, 12, '#1e3a5f', '#152844']} position={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}

export default Trajectory3DScene
