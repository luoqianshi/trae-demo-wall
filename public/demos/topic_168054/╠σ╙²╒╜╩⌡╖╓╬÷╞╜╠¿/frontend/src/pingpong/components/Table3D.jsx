import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * 3D乒乓球桌模型组件
 * 包含：台面、球网、桌腿、白色边线
 * 使用@react-three/fiber的声明式语法
 */

// 球桌尺寸（米）
const TABLE_LENGTH = 2.74
const TABLE_WIDTH = 1.525
const TABLE_HEIGHT = 0.76
const TABLE_THICKNESS = 0.04
const NET_HEIGHT = 0.1525

/**
 * 3D球桌模型
 */
function Table3D() {
  // 桌腿位置
  const legPositions = useMemo(() => [
    [TABLE_LENGTH / 2 - 0.1, TABLE_HEIGHT / 2 - TABLE_THICKNESS, TABLE_WIDTH / 2 - 0.1],
    [TABLE_LENGTH / 2 - 0.1, TABLE_HEIGHT / 2 - TABLE_THICKNESS, -(TABLE_WIDTH / 2 - 0.1)],
    [-(TABLE_LENGTH / 2 - 0.1), TABLE_HEIGHT / 2 - TABLE_THICKNESS, TABLE_WIDTH / 2 - 0.1],
    [-(TABLE_LENGTH / 2 - 0.1), TABLE_HEIGHT / 2 - TABLE_THICKNESS, -(TABLE_WIDTH / 2 - 0.1)],
  ], [])

  return (
    <group>
      {/* 台面 */}
      <mesh position={[0, TABLE_HEIGHT, 0]} castShadow receiveShadow>
        <boxGeometry args={[TABLE_LENGTH, TABLE_THICKNESS, TABLE_WIDTH]} />
        <meshStandardMaterial
          color="#1e4a8e"
          metalness={0.1}
          roughness={0.6}
        />
      </mesh>

      {/* 台面边线（白色） - 使用线段 */}
      <lineSegments position={[0, TABLE_HEIGHT + TABLE_THICKNESS / 2 + 0.001, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(TABLE_LENGTH, 0.002, TABLE_WIDTH)]} />
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </lineSegments>

      {/* 中线（沿球桌长度方向） */}
      <mesh position={[0, TABLE_HEIGHT + TABLE_THICKNESS / 2 + 0.001, 0]}>
        <boxGeometry args={[TABLE_LENGTH, 0.001, 0.005]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 球网 */}
      <mesh position={[0, TABLE_HEIGHT + NET_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.01, NET_HEIGHT, TABLE_WIDTH + 0.02]} />
        <meshStandardMaterial
          color="#e0e0e0"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 球网顶部白色带 */}
      <mesh position={[0, TABLE_HEIGHT + NET_HEIGHT, 0]}>
        <boxGeometry args={[0.02, 0.02, TABLE_WIDTH + 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 球网支柱（左右） */}
      <mesh position={[0, TABLE_HEIGHT + NET_HEIGHT / 2, TABLE_WIDTH / 2 + 0.01]}>
        <cylinderGeometry args={[0.015, 0.015, NET_HEIGHT, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, TABLE_HEIGHT + NET_HEIGHT / 2, -(TABLE_WIDTH / 2 + 0.01)]}>
        <cylinderGeometry args={[0.015, 0.015, NET_HEIGHT, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 桌腿（4根） */}
      {legPositions.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <boxGeometry args={[0.05, TABLE_HEIGHT - TABLE_THICKNESS, 0.05]} />
          <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* 桌腿底部支撑横杆（前后各一根） */}
      <mesh position={[TABLE_LENGTH / 2 - 0.1, 0.03, 0]}>
        <boxGeometry args={[0.05, 0.04, TABLE_WIDTH - 0.2]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-(TABLE_LENGTH / 2 - 0.1), 0.03, 0]}>
        <boxGeometry args={[0.05, 0.04, TABLE_WIDTH - 0.2]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 选手位置标记（两侧地面） */}
      {/* 左侧选手位置 */}
      <mesh position={[-1.5, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
      </mesh>
      {/* 右侧选手位置 */}
      <mesh position={[1.5, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export default Table3D
