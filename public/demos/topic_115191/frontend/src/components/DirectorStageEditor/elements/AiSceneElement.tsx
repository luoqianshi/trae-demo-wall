﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿/** AI 物体渲染：根据单个 mesh 或 SceneDescription 渲染程序化几何体。 */
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { DirectorStageElement, SceneMesh } from '../../../types'

/** mesh type → 中文名映射 */
export const MESH_TYPE_NAME: Record<string, string> = {
  mountain: '山', lake: '湖', river: '河', waterfall: '瀑布',
  rock: '岩石', tree: '树', ground: '地面', cloud: '云',
  house: '房屋', platform: '平台',
  man: '男人', woman: '女人', table: '桌子', chair: '椅子',
}

// ===== 2D SVG 卡通人物（贴在 3D 场景里，始终面向相机） =====

export type Point = readonly [number, number]
/** 三点折线肢体：[肩/胯, 肘/膝, 手/脚] */
export type JointedLimb = readonly [Point, Point, Point]

export interface DancerConfig {
  skin: string
  hair: string
  jacket: string
  shirt: string
  pants: string
  shoes: string
  leftArm: JointedLimb
  rightArm: JointedLimb
  leftLeg: JointedLimb
  rightLeg: JointedLimb
}

/** 姿势预设：每个 action 对应一组四肢端点坐标（viewBox 180×330）。 */
export const POSES: Record<string, Omit<DancerConfig, 'skin' | 'hair' | 'jacket' | 'shirt' | 'pants' | 'shoes'>> = {
  // 站立：四肢自然下垂
  standing: {
    leftArm: [[57, 121], [38, 178], [38, 228]],
    rightArm: [[123, 121], [142, 178], [142, 228]],
    leftLeg: [[72, 201], [68, 258], [66, 310]],
    rightLeg: [[108, 201], [112, 258], [114, 310]],
  },
  // 跳舞：双臂上举外展、腿微开
  dancing: {
    leftArm: [[57, 121], [25, 78], [12, 32]],
    rightArm: [[123, 121], [155, 78], [168, 32]],
    leftLeg: [[72, 201], [60, 258], [52, 312]],
    rightLeg: [[108, 201], [120, 258], [128, 312]],
  },
  // 举手/欢呼：双臂高举
  arms_up: {
    leftArm: [[57, 121], [50, 65], [45, 12]],
    rightArm: [[123, 121], [130, 65], [135, 12]],
    leftLeg: [[72, 201], [70, 258], [68, 310]],
    rightLeg: [[108, 201], [110, 258], [112, 310]],
  },
  // 叉腰：双手在腰间
  hands_on_hips: {
    leftArm: [[57, 121], [38, 185], [68, 200]],
    rightArm: [[123, 121], [142, 185], [112, 200]],
    leftLeg: [[72, 201], [68, 258], [66, 310]],
    rightLeg: [[108, 201], [112, 258], [114, 310]],
  },
  // 坐：腿向前弯
  sitting: {
    leftArm: [[57, 121], [42, 175], [50, 215]],
    rightArm: [[123, 121], [138, 175], [130, 215]],
    leftLeg: [[72, 201], [58, 235], [108, 245]],
    rightLeg: [[108, 201], [122, 235], [72, 255]],
  },
  // 跑：四肢前后摆动
  running: {
    leftArm: [[57, 121], [30, 160], [20, 200]],
    rightArm: [[123, 121], [150, 160], [160, 130]],
    leftLeg: [[72, 201], [60, 245], [45, 295]],
    rightLeg: [[108, 201], [125, 240], [140, 280]],
  },
  // 指向：右臂前伸
  pointing: {
    leftArm: [[57, 121], [40, 178], [42, 225]],
    rightArm: [[123, 121], [160, 115], [175, 110]],
    leftLeg: [[72, 201], [68, 258], [66, 310]],
    rightLeg: [[108, 201], [112, 258], [114, 310]],
  },
  // 跳跃：双臂上举、双腿弯曲
  jumping: {
    leftArm: [[57, 121], [35, 70], [25, 20]],
    rightArm: [[123, 121], [145, 70], [155, 20]],
    leftLeg: [[72, 201], [62, 245], [78, 285]],
    rightLeg: [[108, 201], [118, 245], [102, 285]],
  },
  // 招手：右臂上举挥
  waving: {
    leftArm: [[57, 121], [40, 178], [42, 225]],
    rightArm: [[123, 121], [148, 80], [165, 35]],
    leftLeg: [[72, 201], [68, 258], [66, 310]],
    rightLeg: [[108, 201], [112, 258], [114, 310]],
  },
}

/** action 文本 → 姿势名。 */
function actionToPose(action?: string): string {
  const a = (action || '').toLowerCase().trim()
  if (a.includes('danc')) return 'dancing'
  if (a.includes('arms_up') || a.includes('cheer')) return 'arms_up'
  if (a.includes('wave')) return 'waving'
  if (a.includes('hands_on_hips') || a.includes('hip')) return 'hands_on_hips'
  if (a.includes('sit') || a.includes('kneel')) return 'sitting'
  if (a.includes('run') || a.includes('walk')) return 'running'
  if (a.includes('point')) return 'pointing'
  if (a.includes('jump')) return 'jumping'
  return 'standing'
}

/** 根据 mesh + 性别生成 DancerConfig */
function getDancerConfig(mesh: SceneMesh, isWoman: boolean): DancerConfig {
  const poseName = actionToPose(mesh.action)
  const pose = POSES[poseName] || POSES.standing
  const jacket = mesh.color || (isWoman ? '#d96a8e' : '#3a5a8a')
  return {
    skin: isWoman ? '#e8b890' : '#c89878',
    hair: isWoman ? '#3a2418' : '#15100a',
    jacket,
    shirt: isWoman ? '#f5d0e0' : '#e8e8f0',
    pants: isWoman ? '#2a2438' : '#171a22',
    shoes: '#0f1118',
    ...pose,
  }
}

/** 根据 pose + 颜色直接构造 DancerConfig（不依赖 mesh，供 ArmyElement 使用） */
export function buildDancerConfig(
  pose: string,
  isWoman: boolean,
  colors: { jacket?: string; skin?: string; hair?: string; shirt?: string; pants?: string; shoes?: string },
): DancerConfig {
  const p = POSES[pose] || POSES.standing
  return {
    skin: colors.skin || (isWoman ? '#e8b890' : '#c89878'),
    hair: colors.hair || (isWoman ? '#3a2418' : '#15100a'),
    jacket: colors.jacket || (isWoman ? '#d96a8e' : '#3a5a8a'),
    shirt: colors.shirt || (isWoman ? '#f5d0e0' : '#e8e8f0'),
    pants: colors.pants || '#171a22',
    shoes: colors.shoes || '#0f1118',
    ...p,
  }
}

/** 把 DancerConfig 渲染为完整 SVG 字符串（供 ArmyElement 转 Canvas 纹理）。属性用 kebab-case。 */
export function generateSoldierSVG(dancer: DancerConfig, isWoman: boolean): string {
  const hairPath = isWoman
    ? 'M48 50 C52 14 84 4 112 13 C134 20 140 38 132 66 C118 52 96 46 70 52 C62 54 54 55 48 50 Z M52 50 C44 90 40 130 48 168 C58 150 62 110 64 70 Z'
    : 'M54 48 C58 18 83 6 111 15 C130 21 136 37 130 61 C116 50 97 45 73 50 C65 52 59 53 54 48 Z'
  const limb = (l: JointedLimb, color: string, width: number) =>
    `<polyline points="${l.map(([x, y]) => `${x},${y}`).join(' ')}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${width}" />`
  return `<svg viewBox="0 0 180 330" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;display:block">
<ellipse cx="90" cy="318" rx="66" ry="15" fill="#000" fill-opacity="0.36" />
${limb(dancer.rightLeg, dancer.pants, 25)}
${limb(dancer.rightLeg, dancer.shoes, 18)}
${limb(dancer.rightArm, dancer.jacket, 22)}
<rect x="80" y="92" width="20" height="22" rx="7" fill="${dancer.skin}" />
<path d="M45 114 C54 100 126 100 135 114 L147 201 C130 215 51 215 34 201 Z" fill="${dancer.jacket}" />
<path d="M77 108 L103 108 L119 199 L61 199 Z" fill="${dancer.shirt}" />
<rect x="60" y="196" width="60" height="6" fill="${dancer.shoes}" opacity="0.6" />
<path d="M72 199 H108 L118 222 H62 Z" fill="${dancer.pants}" />
${limb(dancer.leftLeg, dancer.pants, 25)}
${limb(dancer.leftLeg, dancer.shoes, 18)}
${limb(dancer.leftArm, dancer.jacket, 22)}
<circle cx="${dancer.leftArm[2][0]}" cy="${dancer.leftArm[2][1]}" r="9" fill="${dancer.skin}" />
<circle cx="${dancer.rightArm[2][0]}" cy="${dancer.rightArm[2][1]}" r="9" fill="${dancer.skin}" />
<ellipse cx="49" cy="58" rx="10" ry="13" fill="${dancer.skin}" />
<ellipse cx="131" cy="58" rx="10" ry="13" fill="${dancer.skin}" />
<ellipse cx="90" cy="56" rx="38" ry="43" fill="${dancer.skin}" />
<path d="${hairPath}" fill="${dancer.hair}" />
<circle cx="75" cy="59" r="5" fill="#161616" />
<circle cx="105" cy="59" r="5" fill="#161616" />
<circle cx="76" cy="57" r="1.5" fill="#ffffff" />
<circle cx="106" cy="57" r="1.5" fill="#ffffff" />
<path d="M78 82 C86 91 98 91 106 82" fill="none" stroke="#44221c" stroke-linecap="round" stroke-width="5" />
</svg>`
}

const pointStr = (limb: JointedLimb) => limb.map(([x, y]) => `${x},${y}`).join(' ')

/** 三点折线肢体 */
function JointedStroke({ limb, color, width }: { limb: JointedLimb; color: string; width: number }) {
  return (
    <polyline
      points={pointStr(limb)}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
    />
  )
}

/** SVG 卡通人物：头发、脸、五官、脖子、上衣、外套、四肢、鞋 */
function CartoonHuman({ dancer, isWoman }: { dancer: DancerConfig; isWoman: boolean }) {
  // 女性头发更长
  const hairPath = isWoman
    ? 'M48 50 C52 14 84 4 112 13 C134 20 140 38 132 66 C118 52 96 46 70 52 C62 54 54 55 48 50 Z M52 50 C44 90 40 130 48 168 C58 150 62 110 64 70 Z'
    : 'M54 48 C58 18 83 6 111 15 C130 21 136 37 130 61 C116 50 97 45 73 50 C65 52 59 53 54 48 Z'
  return (
    <svg viewBox="0 0 180 330" style={{ overflow: 'visible', display: 'block' }}>
      {/* 落地阴影 */}
      <ellipse cx="90" cy="318" rx="66" ry="15" fill="rgba(0,0,0,0.36)" />
      {/* 后侧腿（先画，被身体遮住一部分） */}
      <JointedStroke limb={dancer.rightLeg} color={dancer.pants} width={25} />
      <JointedStroke limb={dancer.rightLeg} color={dancer.shoes} width={18} />
      {/* 后侧手臂 */}
      <JointedStroke limb={dancer.rightArm} color={dancer.jacket} width={22} />
      {/* 脖子 */}
      <rect x="80" y="92" width="20" height="22" rx="7" fill={dancer.skin} />
      {/* 外套 */}
      <path d="M45 114 C54 100 126 100 135 114 L147 201 C130 215 51 215 34 201 Z" fill={dancer.jacket} />
      {/* 衬衫 */}
      <path d="M77 108 L103 108 L119 199 L61 199 Z" fill={dancer.shirt} />
      {/* 腰带 */}
      <rect x="60" y="196" width="60" height="6" fill={dancer.shoes} opacity="0.6" />
      {/* 裤腰 */}
      <path d="M72 199 H108 L118 222 H62 Z" fill={dancer.pants} />
      {/* 前侧腿 */}
      <JointedStroke limb={dancer.leftLeg} color={dancer.pants} width={25} />
      <JointedStroke limb={dancer.leftLeg} color={dancer.shoes} width={18} />
      {/* 前侧手臂 */}
      <JointedStroke limb={dancer.leftArm} color={dancer.jacket} width={22} />
      {/* 手（肤色圆点，在肢体末端） */}
      <circle cx={dancer.leftArm[2][0]} cy={dancer.leftArm[2][1]} r="9" fill={dancer.skin} />
      <circle cx={dancer.rightArm[2][0]} cy={dancer.rightArm[2][1]} r="9" fill={dancer.skin} />
      {/* 耳朵 */}
      <ellipse cx="49" cy="58" rx="10" ry="13" fill={dancer.skin} />
      <ellipse cx="131" cy="58" rx="10" ry="13" fill={dancer.skin} />
      {/* 脸 */}
      <ellipse cx="90" cy="56" rx="38" ry="43" fill={dancer.skin} />
      {/* 头发 */}
      <path d={hairPath} fill={dancer.hair} />
      {/* 眼睛 */}
      <circle cx="75" cy="59" r="5" fill="#161616" />
      <circle cx="105" cy="59" r="5" fill="#161616" />
      <circle cx="76" cy="57" r="1.5" fill="#ffffff" />
      <circle cx="106" cy="57" r="1.5" fill="#ffffff" />
      {/* 嘴 */}
      <path d="M78 82 C86 91 98 91 106 82" fill="none" stroke="#44221c" strokeLinecap="round" strokeWidth="5" />
    </svg>
  )
}

function MeshItem({ mesh }: { mesh: SceneMesh }) {
  const position = mesh.position
  const rotation = mesh.rotation || [0, 0, 0]
  const scale = mesh.scale
  const color = mesh.color

  switch (mesh.type) {
    case 'mountain':
      return (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <coneGeometry args={[0.5, 1, 24]} />
          <meshStandardMaterial color={color} roughness={0.85} flatShading />
        </mesh>
      )

    case 'lake':
    case 'river':
      // 水面：半透明 plane
      return (
        <mesh
          position={position}
          rotation={[-Math.PI / 2, rotation[1], rotation[2]]}
          scale={scale}
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.72}
            roughness={0.15}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )

    case 'ground':
    case 'platform':
      // 地面/平台：平实心 plane
      return (
        <mesh
          position={position}
          rotation={[-Math.PI / 2, rotation[1], rotation[2]]}
          scale={scale}
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      )

    case 'waterfall':
      // 瀑布：竖直薄板，半透明 + 自发光模拟流水
      return (
        <mesh position={position} rotation={rotation} scale={scale}>
          <boxGeometry args={[1, 1, 0.06]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.65}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.1}
          />
        </mesh>
      )

    case 'rock':
      return (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color={color} roughness={0.95} flatShading />
        </mesh>
      )

    case 'tree':
      // 树：cylinder 树干 + cone 树冠
      return (
        <group position={position} rotation={rotation} scale={scale}>
          <mesh castShadow position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.5, 8]} />
            <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 0.75, 0]}>
            <coneGeometry args={[0.4, 0.7, 10]} />
            <meshStandardMaterial color={color} roughness={0.8} flatShading />
          </mesh>
        </group>
      )

    case 'cloud':
      // 云：多个 sphere 组合
      return (
        <group position={position} rotation={rotation} scale={scale}>
          <mesh>
            <sphereGeometry args={[0.5, 12, 10]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} roughness={1} />
          </mesh>
          <mesh position={[0.45, -0.05, 0]}>
            <sphereGeometry args={[0.35, 12, 10]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} roughness={1} />
          </mesh>
          <mesh position={[-0.45, -0.05, 0]}>
            <sphereGeometry args={[0.35, 12, 10]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} roughness={1} />
          </mesh>
        </group>
      )

    case 'house':
      // 房屋：box 主体 + cone 屋顶（4 段）
      return (
        <group position={position} rotation={rotation} scale={scale}>
          <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[1, 0.5, 1]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.85, 0.4, 4]} />
            <meshStandardMaterial color="#5a2a1a" roughness={0.85} flatShading />
          </mesh>
        </group>
      )

    case 'man':
    case 'woman': {
      const isWoman = mesh.type === 'woman'
      const dancer = getDancerConfig(mesh, isWoman)
      return (
        <group position={position} rotation={rotation}>
          <Html
            transform
            distanceFactor={3}
            position={[0, 0.9, 0]}
            zIndexRange={[20, 0]}
          >
            <div style={{ width: 90, height: 165, pointerEvents: 'none' }}>
              <CartoonHuman dancer={dancer} isWoman={isWoman} />
            </div>
          </Html>
        </group>
      )
    }

    case 'table':
      // 桌子：box 桌面 + 4 圆柱腿
      return (
        <group position={position} rotation={rotation} scale={scale}>
          <mesh castShadow receiveShadow position={[0, 0.74, 0]}>
            <boxGeometry args={[1.2, 0.08, 0.7]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {([[-0.5, -0.28], [-0.5, 0.28], [0.5, -0.28], [0.5, 0.28]] as const).map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.35, z]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
          ))}
        </group>
      )

    case 'chair':
      // 椅子：box 座面 + box 靠背 + 4 圆柱腿
      return (
        <group position={position} rotation={rotation} scale={scale}>
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.5]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.75, -0.22]}>
            <boxGeometry args={[0.5, 0.6, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {([[-0.2, -0.2], [-0.2, 0.2], [0.2, -0.2], [0.2, 0.2]] as const).map(([x, z], i) => (
            <mesh key={i} castShadow position={[x, 0.2, z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
          ))}
        </group>
      )

    default:
      return null
  }
}

export function AiSceneElement({ element }: { element: DirectorStageElement }) {
  const meshes = element.mesh ? [element.mesh] : (element.sceneDescription?.meshes || [])
  return (
    <group>
      {meshes.map((mesh, i) => (
        <MeshItem key={i} mesh={mesh} />
      ))}
    </group>
  )
}
