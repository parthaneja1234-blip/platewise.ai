"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import FoodModel from "@/components/FoodModel";
import { useAppContext } from "@/context/AppContext";

// Mini glowing oven mesh
function MiniOven() {
  const glowLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 2.5 + Math.sin(t * 3) * 0.8;
    }
  });

  return (
    <group position={[-1.2, -0.2, -0.4]}>
      {/* Oven Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.2, 1.0]} />
        <meshStandardMaterial color="#1a1e22" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Window */}
      <mesh position={[0, 0, 0.51]}>
        <boxGeometry args={[1.0, 0.7, 0.04]} />
        <meshStandardMaterial
          color="#381a05"
          transparent
          opacity={0.65}
          roughness={0.2}
        />
      </mesh>
      {/* Brass Trim */}
      <mesh position={[0, 0.48, 0.52]}>
        <boxGeometry args={[1.2, 0.1, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Internal warm glow */}
      <pointLight
        ref={glowLightRef}
        position={[0, 0, 0.2]}
        color="#f97316"
        intensity={3}
        distance={2.8}
      />
    </group>
  );
}

// Floating props with gentle parallax
function FloatingKitchenProps() {
  const sceneGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!sceneGroupRef.current) return;
    // Gentle mouse parallax
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.2;
    sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.y,
      targetX,
      0.05
    );
    sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.x,
      -targetY,
      0.05
    );
  });

  return (
    <group ref={sceneGroupRef}>
      <MiniOven />

      {/* Floating Fresh Bread */}
      <Float speed={1.8} rotationIntensity={0.25} floatIntensity={0.35}>
        <group position={[0.2, 0.3, 0.3]} rotation={[0.2, 0.5, 0]}>
          <FoodModel id="bread" targetSize={0.7} groundBase={false} castShadow />
        </group>
      </Float>

      {/* Floating Katori Soup */}
      <Float speed={2.2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[1.3, -0.1, 0.1]} rotation={[-0.1, -0.4, 0.1]}>
          <FoodModel id="bowl-soup" targetSize={0.65} groundBase={false} castShadow />
        </group>
      </Float>

      {/* Floating Fresh Apple */}
      <Float speed={1.6} rotationIntensity={0.3} floatIntensity={0.3}>
        <group position={[-0.2, -0.35, 0.7]} rotation={[0.3, 0.2, 0]}>
          <FoodModel id="apple" targetSize={0.45} groundBase={false} castShadow />
        </group>
      </Float>

      {/* Floating Chai Cup */}
      <Float speed={2.0} rotationIntensity={0.2} floatIntensity={0.35}>
        <group position={[0.9, 0.5, -0.2]} rotation={[0.1, -0.6, 0]}>
          <FoodModel id="cup-tea" targetSize={0.5} groundBase={false} castShadow />
        </group>
      </Float>

      {/* Warm Kitchen Steam Particles */}
      <Sparkles
        count={20}
        scale={[2.5, 1.8, 1.8]}
        position={[0, 0.2, 0]}
        size={2.2}
        speed={0.4}
        color="#fed7aa"
        opacity={0.45}
      />
    </group>
  );
}

function SceneFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#0e2412] to-[#1a3a1a]">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
        <span className="text-3xl">🍲</span>
      </div>
      <h4 className="font-serif text-sm font-bold text-[#faf8f2]">
        Kitchen Intelligence Live
      </h4>
      <p className="text-[11px] text-[#8fa896] mt-1 max-w-xs">
        Automated batch prep & proofing schedules synced to attendance.
      </p>
    </div>
  );
}

export default function DashboardKitchenScene() {
  const { graphicsQuality } = useAppContext();

  return (
    <div className="relative w-full h-[240px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a180d]/90 via-[#142814]/80 to-[#102413]/90 border border-amber-500/25 shadow-lg flex flex-col justify-between">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0">
        {graphicsQuality !== "off" ? (
          <Canvas
            camera={{ position: [0, 0.5, 3.2], fov: 44 }}
            shadows={graphicsQuality !== "low"}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              antialias: graphicsQuality !== "low",
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight
              position={[4, 6, 4]}
              intensity={1.6}
              castShadow={graphicsQuality !== "low"}
            />
            <pointLight position={[-3, 2, -1]} intensity={0.6} color="#fdba74" />

            <Suspense fallback={null}>
              <FloatingKitchenProps />
            </Suspense>

            <ContactShadows
              position={[0, -0.75, 0]}
              opacity={0.4}
              scale={5}
              blur={1.5}
              far={3}
            />
          </Canvas>
        ) : (
          <SceneFallback />
        )}
      </div>

      {/* Glass Frosting Overlays & Header Info */}
      <div className="relative z-10 p-5 pointer-events-none flex items-start justify-between">
        <div className="space-y-1 bg-forest-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/20 max-w-[260px]">
          <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold">
            Live Kitchen Scene
          </span>
          <h3 className="font-serif text-sm font-bold text-[#FAF8F2] leading-tight">
            Real-Time Prep & Batch Flow
          </h3>
        </div>

        <span className="text-[10px] font-mono text-emerald-300 bg-forest-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Syncing Live</span>
        </span>
      </div>

      {/* Glass Bottom Bar */}
      <div className="relative z-10 px-5 py-3 pointer-events-none bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent flex items-center justify-between text-[11px] text-[#8fa896]">
        <span className="font-mono text-amber-300/80">
          Kenney GLBs &bull; Interactive Parallax
        </span>
        <span className="text-[10px] text-cream-200/60">
          Drag / Move pointer to inspect
        </span>
      </div>
    </div>
  );
}
