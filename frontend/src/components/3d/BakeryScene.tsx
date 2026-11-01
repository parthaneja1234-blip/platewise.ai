"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Individual animated steam particle
interface SteamParticleData {
  offsetY: number;
  speed: number;
  driftX: number;
  driftZ: number;
  initialY: number;
}

function SteamParticles({ count = 18 }: { count?: number }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  const particles = useMemo<SteamParticleData[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      offsetY: (i / count) * 1.8,
      speed: 0.25 + (i % 5) * 0.08,
      driftX: ((i % 7) - 3) * 0.08,
      driftZ: (((i * 3) % 7) - 3) * 0.06,
      initialY: 0.4,
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = particles[i];
      const cycle = ((t * p.speed + p.offsetY) % 2.0); // 0 to 2
      mesh.position.y = p.initialY + cycle;
      mesh.position.x = Math.sin(t * 1.5 + i) * 0.15 + p.driftX;
      mesh.position.z = Math.cos(t * 1.2 + i) * 0.1 + p.driftZ + 0.2;

      // Expand and fade as it rises
      const scale = 0.08 + cycle * 0.12;
      mesh.scale.set(scale, scale * 1.3, scale);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        // Fade in quickly, then fade out
        if (cycle < 0.3) {
          mat.opacity = (cycle / 0.3) * 0.25;
        } else {
          mat.opacity = Math.max(0, (1 - (cycle - 0.3) / 1.7) * 0.25);
        }
      }
    });
  });

  return (
    <group>
      {particles.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[0, 0.4, 0.2]}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color="#fff4e0"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Glowing Oven with procedural chamber and heating elements
function Oven() {
  const glowLightRef = useRef<THREE.PointLight>(null);
  const coilMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Warm pulse inside oven
    const pulse = Math.sin(t * 2.2) * 0.5 + 0.5;
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 3.5 + pulse * 1.5;
    }
    if (coilMatRef.current) {
      coilMatRef.current.emissiveIntensity = 1.2 + pulse * 0.8;
    }
  });

  return (
    <group position={[0, -0.1, 0]}>
      {/* Outer Oven Body (Dark Graphite / Slate) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.3, 1.8, 1.7]} />
        <meshStandardMaterial
          color="#1e2226"
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Top Trim / Control Panel Accent in Brushed Brass */}
      <mesh position={[0, 0.75, 0.86]}>
        <boxGeometry args={[2.2, 0.22, 0.05]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* Control Knobs */}
      {[-0.6, 0, 0.6].map((x, idx) => (
        <mesh key={idx} position={[x, 0.75, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Oven Window Frame */}
      <mesh position={[0, -0.1, 0.86]}>
        <boxGeometry args={[1.7, 1.1, 0.04]} />
        <meshStandardMaterial color="#14171a" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Oven Window Glass (tinted amber translucency) */}
      <mesh position={[0, -0.1, 0.88]}>
        <boxGeometry args={[1.5, 0.9, 0.02]} />
        <meshStandardMaterial
          color="#422006"
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0.2}
        />
      </mesh>

      {/* Door Handle (Warm Gold Brass) */}
      <group position={[0, 0.38, 0.94]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 1.3, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[-0.55, -0.04, -0.04]}>
          <boxGeometry args={[0.05, 0.08, 0.08]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} />
        </mesh>
        <mesh position={[0.55, -0.04, -0.04]}>
          <boxGeometry args={[0.05, 0.08, 0.08]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} />
        </mesh>
      </group>

      {/* Glowing Upper Heating Element */}
      <mesh position={[0, 0.32, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.03, 12, 32]} />
        <meshStandardMaterial
          ref={coilMatRef}
          color="#ff4500"
          emissive="#ff5500"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Oven Internal Glow Point Light */}
      <pointLight
        ref={glowLightRef}
        position={[0, 0.05, 0.3]}
        color="#ff7700"
        intensity={4}
        distance={4.5}
        decay={2}
      />

      {/* Baking Hearth Wire Rack */}
      <mesh position={[0, -0.22, 0.2]}>
        <boxGeometry args={[1.5, 0.02, 1.1]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} wireframe />
      </mesh>
    </group>
  );
}

// Loaf of Bread: Rises and turns golden brown in a continuous loop
function LoafOfBread() {
  const breadGroupRef = useRef<THREE.Group>(null);
  const breadMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const doughColor = useMemo(() => new THREE.Color("#f7eedb"), []);
  const goldenCrustColor = useMemo(() => new THREE.Color("#853d0e"), []);
  const bakedGlow = useMemo(() => new THREE.Color("#d97706"), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // 6-second rhythmic baking cycle
    const cycleDuration = 6.0;
    const progress = (t % cycleDuration) / cycleDuration;
    // Smooth bell curve 0 -> 1 -> 0
    const rise = Math.sin(progress * Math.PI);

    if (breadGroupRef.current) {
      // Bread expands vertically and horizontally as it bakes
      const scaleX = 1.0 + rise * 0.28;
      const scaleY = 0.65 + rise * 0.42;
      const scaleZ = 0.85 + rise * 0.22;
      breadGroupRef.current.scale.set(scaleX, scaleY, scaleZ);
      breadGroupRef.current.position.y = -0.15 + rise * 0.08;
    }

    if (breadMatRef.current) {
      // Color smoothly morphs from pale dough to deep artisanal golden brown
      breadMatRef.current.color.lerpColors(doughColor, goldenCrustColor, rise);
      breadMatRef.current.emissive.lerpColors(doughColor, bakedGlow, rise * 0.25);
    }
  });

  return (
    <group ref={breadGroupRef} position={[0, -0.15, 0.32]}>
      {/* Main Loaf Geometry */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshStandardMaterial
          ref={breadMatRef}
          color="#f7eedb"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Decorative Bread Scoring Cuts */}
      {[-0.18, 0, 0.18].map((xOffset, idx) => (
        <mesh
          key={idx}
          position={[xOffset, 0.34, 0]}
          rotation={[0, 0, -0.35 + idx * 0.35]}
        >
          <boxGeometry args={[0.08, 0.02, 0.45]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Floating Bagel (Torus) with gentle orbit and bobbing
function FloatingBagel() {
  const bagelRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (bagelRef.current) {
      bagelRef.current.position.y = 0.75 + Math.sin(t * 1.8) * 0.12;
      bagelRef.current.rotation.x = 0.5 + Math.sin(t * 0.9) * 0.2;
      bagelRef.current.rotation.y += 0.012;
    }
  });

  return (
    <group ref={bagelRef} position={[-1.75, 0.75, 0.4]}>
      {/* Golden Sesame Bagel */}
      <mesh>
        <torusGeometry args={[0.34, 0.14, 24, 36]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.45}
          metalness={0.1}
        />
      </mesh>
      {/* Sesame speckles */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.34, 0.14, Math.sin(angle) * 0.34]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
        );
      })}
    </group>
  );
}

// Floating Cupcake with swirled frosting & cherry
function FloatingCupcake() {
  const cupcakeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (cupcakeRef.current) {
      cupcakeRef.current.position.y = 0.65 + Math.sin(t * 1.6 + 1.5) * 0.14;
      cupcakeRef.current.rotation.y += 0.014;
      cupcakeRef.current.rotation.z = Math.sin(t * 1.2) * 0.1;
    }
  });

  return (
    <group ref={cupcakeRef} position={[1.85, 0.65, 0.3]}>
      {/* Pleated Paper Liner */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.26, 0.18, 0.28, 18]} />
        <meshStandardMaterial color="#fef08a" roughness={0.7} />
      </mesh>

      {/* Baked Sponge Cake Core */}
      <mesh position={[0, 0.02, 0]}>
        <sphereGeometry args={[0.27, 24, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

      {/* Swirled Cream Frosting Layer 1 */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.22, 24, 16]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
      </mesh>

      {/* Swirled Cream Frosting Layer 2 */}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.15, 20, 16]} />
        <meshStandardMaterial color="#fffbeb" roughness={0.3} />
      </mesh>

      {/* Ruby Berry on Top */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#dc2626"
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

// Floating Ceramic Plate
function FloatingPlate() {
  const plateRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (plateRef.current) {
      plateRef.current.position.y = -0.75 + Math.sin(t * 1.4 + 2.5) * 0.1;
      plateRef.current.rotation.x = 0.4 + Math.sin(t * 0.8) * 0.1;
      plateRef.current.rotation.y = Math.cos(t * 0.7) * 0.15;
    }
  });

  return (
    <group ref={plateRef} position={[1.4, -0.75, 0.9]}>
      {/* Ceramic Plate Body */}
      <mesh>
        <cylinderGeometry args={[0.55, 0.48, 0.04, 32]} />
        <meshStandardMaterial
          color="#faf7ee"
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      {/* Plate Rim */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[0.5, 0.03, 16, 32]} />
        <meshStandardMaterial color="#f0ede1" roughness={0.25} />
      </mesh>
      {/* Amber Rim Accent Line */}
      <mesh position={[0, 0.035, 0]}>
        <torusGeometry args={[0.42, 0.008, 12, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Kitchen Counter Tabletop Base
function KitchenCounter() {
  return (
    <group position={[0, -1.05, 0]}>
      {/* Counter Top (Honed Light Cream Stone) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.4, 0.16, 2.6]} />
        <meshStandardMaterial
          color="#ede5d8"
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      {/* Front Bullnose Accent */}
      <mesh position={[0, 0, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 4.4, 16]} />
        <meshStandardMaterial color="#e0d5c3" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Main Interactive Bakery Scene Group with Subtle Mouse Parallax
function BakeryKitchenGroup() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Smooth gentle mouse parallax
    const targetRotY = state.pointer.x * 0.25;
    const targetRotX = -state.pointer.y * 0.12;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.05
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.05
    );
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      <Oven />
      <LoafOfBread />
      <SteamParticles count={20} />
      <FloatingBagel />
      <FloatingCupcake />
      <FloatingPlate />
      <KitchenCounter />
    </group>
  );
}

interface BakerySceneProps {
  isVisible?: boolean;
}

export default function BakeryScene({ isVisible = true }: BakerySceneProps) {
  return (
    <div className="relative w-full h-full min-h-[460px] md:min-h-[580px] flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0.4, 4.4], fov: 42 }}
        dpr={[1, 1.5]} // Performance: limit canvas DPR
        frameloop={isVisible ? "always" : "never"} // Pause rendering when off screen
        className="w-full h-full"
      >
        {/* Soft Warm Ambient Light */}
        <ambientLight color="#fff7ed" intensity={0.95} />

        {/* Primary Warm Sun Key Light */}
        <directionalLight
          position={[4, 6, 4]}
          color="#fffbeb"
          intensity={1.4}
        />

        {/* Fill Light for Shadows */}
        <directionalLight
          position={[-4, 3, 2]}
          color="#fef3c7"
          intensity={0.6}
        />

        {/* Back Rim Light for Food Edges */}
        <pointLight
          position={[0, 3, -3]}
          color="#fbbf24"
          intensity={1.8}
        />

        {/* Interactive 3D Bakery Kitchen */}
        <BakeryKitchenGroup />
      </Canvas>

      {/* Subtle Warm Amber Vignette Glow in Background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-radial from-amber-500/10 via-transparent to-transparent opacity-75"
        aria-hidden="true"
      />
    </div>
  );
}
