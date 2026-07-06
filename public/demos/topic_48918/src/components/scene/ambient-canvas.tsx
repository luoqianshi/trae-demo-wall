'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, OrbitControls, Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';

function OrbitalCluster() {
  const groupRef = useRef<THREE.Group | null>(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: `particle-${index}`,
        position: [Math.cos(index / 3) * (1.8 + (index % 4) * 0.4), ((index % 6) - 3) * 0.28, Math.sin(index / 3) * (1.5 + (index % 3) * 0.35)] as [number, number, number],
        scale: 0.03 + (index % 5) * 0.01,
        color: index % 2 === 0 ? '#4fd1ff' : '#8b7cff',
      })),
    [],
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.8} rotationIntensity={0.18} floatIntensity={0.35}>
        <Trail width={0.7} color="#4fd1ff" length={4} attenuation={(width) => width}>
          <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#89e1ff" emissive="#2155ff" emissiveIntensity={0.65} roughness={0.18} metalness={0.42} wireframe />
          </mesh>
        </Trail>
      </Float>

      <Sphere args={[0.18, 32, 32]} position={[1.9, 0.4, 1.1]}>
        <meshStandardMaterial color="#ffe0a6" emissive="#7d5cff" emissiveIntensity={0.35} roughness={0.12} />
      </Sphere>

      <Sphere args={[0.12, 24, 24]} position={[-2.3, -0.8, -1.3]}>
        <meshStandardMaterial color="#86f6c8" emissive="#0b7254" emissiveIntensity={0.32} roughness={0.2} />
      </Sphere>

      <Line
        points={[
          [-2.2, -0.6, -1.3],
          [-0.4, -0.2, -0.2],
          [1.9, 0.4, 1.1],
        ]}
        color="#4fd1ff"
        transparent
        opacity={0.35}
        lineWidth={1}
      />

      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.position}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial color={particle.color} emissive={particle.color} emissiveIntensity={0.38} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function AmbientCanvas() {
  return (
    <div className="jobscope-ambient-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5.8], fov: 42 }} dpr={[1, 1.8]}>
        <color attach="background" args={['#050914']} />
        <fog attach="fog" args={['#050914', 4, 14]} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[4, 4, 3]} intensity={1.4} color="#9ad8ff" />
        <pointLight position={[-3, -1, -2]} intensity={1.2} color="#7d5cff" />
        <OrbitalCluster />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.45} />
      </Canvas>
    </div>
  );
}
