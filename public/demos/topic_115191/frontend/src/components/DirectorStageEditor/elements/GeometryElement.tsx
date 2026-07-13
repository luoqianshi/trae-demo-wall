/** 基础几何体渲染。 */
import { useMemo } from 'react'
import * as THREE from 'three'
import type { DirectorStageElement } from '../../../types'

export function GeometryElement({ element }: { element: DirectorStageElement }) {
  const color = element.color || '#6b7280'
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }), [color])

  const geometry = useMemo(() => {
    switch (element.geometry) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />
      case 'cylinder':
        return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
      case 'cone':
        return <coneGeometry args={[0.5, 1, 32]} />
      case 'torus':
        return <torusGeometry args={[0.4, 0.15, 16, 32]} />
      case 'plane':
        return <planeGeometry args={[1, 1]} />
      case 'cube':
      default:
        return <boxGeometry args={[1, 1, 1]} />
    }
  }, [element.geometry])

  return (
    <mesh
      position={element.transform.position}
      rotation={element.transform.rotation}
      scale={element.transform.scale}
      material={material}
      visible={element.visible !== false}
    >
      {geometry}
    </mesh>
  )
}
