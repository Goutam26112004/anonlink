'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const shapes = [
  { label: 'voice', geo: () => new THREE.TorusGeometry(1.2, 0.4, 16, 48) },
  { label: 'privacy', geo: () => new THREE.IcosahedronGeometry(1.3, 0) },
  { label: 'matching', geo: () => new THREE.SphereGeometry(1.2, 24, 24) },
];

interface MorphingObjectProps {
  activeIndex?: number;
}

export default function MorphingObject({ activeIndex = 0 }: MorphingObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetGeo] = useState(() => shapes[0].geo());

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.15;
    meshRef.current.rotation.y += delta * 0.25;
  });

  const { geo } = shapes[activeIndex % shapes.length];

  return (
    <mesh ref={meshRef} geometry={geo()}>
      <meshPhysicalMaterial
        color="#00e5ff"
        metalness={0.3}
        roughness={0.1}
        transparent
        opacity={0.25}
        wireframe
        clearcoat={0.4}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}
