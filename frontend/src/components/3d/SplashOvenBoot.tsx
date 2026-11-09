"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";
import { MeshoptDecoder } from "three-stdlib";
import { MODEL_ROLES } from "@/lib/assets/modelRoles";
import { useAppContext } from "@/context/AppContext";
import { preloadKeyModels } from "@/components/FoodModel";

const decoder = typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder;

/**
 * 3D Rising Loaf with Material Color & Emissive Lerp
 */
function RisingLoafModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const modelId = MODEL_ROLES.ovenHero.primaryModelId;
  const filePath = `/models/${modelId}.glb`;

  // Safe GLB loader with Meshopt decoder
  const { scene, animations } = useGLTF(
    filePath,
    false,
    true,
    (loader) => {
      loader.setMeshoptDecoder(decoder);
    }
  );

  const { actions, names } = useAnimations(animations, groupRef);

  // Play animation clips if present
  useEffect(() => {
    if (names && names.length > 0 && actions) {
      names.forEach((name) => {
        actions[name]?.reset().fadeIn(0.5).play();
      });
    }
  }, [actions, names]);

  // Clone scene so materials don't bleed
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    return clone;
  }, [scene]);

  const doughColor = useMemo(() => new THREE.Color("#f7eedb"), []);
  const goldenCrustColor = useMemo(() => new THREE.Color("#853d0e"), []);
  const bakedGlow = useMemo(() => new THREE.Color("#d97706"), []);

  useFrame(() => {
    if (!groupRef.current) return;

    // Scale rises dynamically from compact dough (scale 0.75) to expanded loaf (1.15)
    const riseFactor = Math.min(1, Math.max(0, progress));
    const sx = 0.75 + riseFactor * 0.4;
    const sy = 0.65 + riseFactor * 0.55;
    const sz = 0.75 + riseFactor * 0.4;
    groupRef.current.scale.set(sx, sy, sz);
    groupRef.current.position.y = -0.15 + riseFactor * 0.12;

    // Traverse meshes to lerp color from raw dough to golden brown + warm emissive
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.color) {
          mat.color.lerpColors(doughColor, goldenCrustColor, riseFactor);
          if (mat.emissive) {
            mat.emissive.lerpColors(doughColor, bakedGlow, riseFactor * 0.35);
            mat.emissiveIntensity = 0.2 + riseFactor * 0.6;
          }
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.15, 0.2]}>
      <primitive object={clonedScene} />
    </group>
  );
}

/**
 * Procedural Fallback Dough Ball if GLB fails
 */
function ProceduralRisingDough({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const doughColor = useMemo(() => new THREE.Color("#f7eedb"), []);
  const goldenCrustColor = useMemo(() => new THREE.Color("#853d0e"), []);
  const bakedGlow = useMemo(() => new THREE.Color("#d97706"), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const riseFactor = Math.min(1, Math.max(0, progress));
    const sx = 0.8 + riseFactor * 0.35;
    const sy = 0.6 + riseFactor * 0.5;
    const sz = 0.8 + riseFactor * 0.35;
    meshRef.current.scale.set(sx, sy, sz);

    if (matRef.current) {
      matRef.current.color.lerpColors(doughColor, goldenCrustColor, riseFactor);
      matRef.current.emissive.lerpColors(doughColor, bakedGlow, riseFactor * 0.35);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -0.1, 0.2]} castShadow>
      <sphereGeometry args={[0.55, 32, 24]} />
      <meshStandardMaterial
        ref={matRef}
        color="#f7eedb"
        roughness={0.6}
        metalness={0.05}
      />
    </mesh>
  );
}

/**
 * 3D Oven Chamber with Flickering Heat Glow & Heating Coils
 */
function OvenChamber() {
  const glowLightRef = useRef<THREE.PointLight>(null);
  const coilMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Flickering heat pulse
    const flicker = Math.sin(t * 4.5) * 0.2 + Math.cos(t * 7.1) * 0.15 + 0.65;
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 3.0 + flicker * 2.0;
    }
    if (coilMatRef.current) {
      coilMatRef.current.emissiveIntensity = 1.2 + flicker * 1.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Oven Body */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[2.5, 2.0, 1.8]} />
        <meshStandardMaterial color="#1a1e22" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Interior Oven Chamber Cavity */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[2.0, 1.4, 1.4]} />
        <meshStandardMaterial
          color="#121517"
          roughness={0.8}
          metalness={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Glowing Heating Element Coil */}
      <mesh position={[0, 0.55, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.035, 12, 32]} />
        <meshStandardMaterial
          ref={coilMatRef}
          color="#ff4500"
          emissive="#ff5500"
          emissiveIntensity={1.8}
        />
      </mesh>

      {/* Internal Baking Rack */}
      <mesh position={[0, -0.28, 0.1]}>
        <boxGeometry args={[1.7, 0.02, 1.1]} />
        <meshStandardMaterial color="#718096" metalness={0.85} roughness={0.3} wireframe />
      </mesh>

      {/* Flickering Warm Light */}
      <pointLight
        ref={glowLightRef}
        position={[0, 0.2, 0.25]}
        color="#ff7a00"
        intensity={4}
        distance={4.5}
        decay={2}
      />
    </group>
  );
}

export default function SplashOvenBoot() {
  const { graphicsQuality } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [showBoot, setShowBoot] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelError, setModelError] = useState(false);

  // Strictly check session state AFTER client mount (never during SSR)
  useEffect(() => {
    setMounted(true);
    preloadKeyModels();
    try {
      const alreadyBooted = sessionStorage.getItem("pw_session_booted");
      if (!alreadyBooted) {
        setShowBoot(true);
      }
    } catch {
      // In case private browsing blocks sessionStorage
      setShowBoot(false);
    }
  }, []);

  // Animation progress timer (0 -> 1 over 3.8s)
  const handleDismiss = () => {
    setShowBoot(false);
    try {
      sessionStorage.setItem("pw_session_booted", "true");
    } catch {}
  };

  useEffect(() => {
    if (!showBoot) return;

    const startTime = Date.now();
    const duration = 3800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / duration);
      setProgress(pct);

      if (pct >= 1) {
        clearInterval(interval);
        setTimeout(() => handleDismiss(), 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [showBoot]);

  // If not mounted or not showing boot screen, render null
  if (!mounted || !showBoot) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0e2412]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-300">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

      {/* 3D Scene Container */}
      <div className="relative w-full max-w-lg h-[340px] sm:h-[400px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#142814] to-[#0a180d] border border-amber-500/30 shadow-[0_25px_70px_rgba(0,0,0,0.8)]">
        {graphicsQuality !== "off" ? (
          <Canvas
            camera={{ position: [0, 0.4, 2.6], fov: 42 }}
            shadows
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              antialias: true,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[2, 3, 2]} intensity={1.2} />

            <OvenChamber />

            {/* Steam Particles rising from the loaf */}
            <Sparkles
              count={28}
              scale={[1.2, 1.8, 1.0]}
              position={[0, 0.2, 0.2]}
              size={2.5}
              speed={0.6}
              color="#ffeed4"
              opacity={0.6}
            />

            {!modelError ? (
              <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.05}>
                <RisingLoafModel progress={progress} />
              </Float>
            ) : (
              <ProceduralRisingDough progress={progress} />
            )}
          </Canvas>
        ) : (
          /* Static 2D Poster Fallback for "Off" mode */
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#142814]">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
              <span className="text-4xl animate-pulse">🍞</span>
            </div>
            <p className="text-amber-300 font-serif text-lg font-bold">
              Preheating the oven…
            </p>
          </div>
        )}

        {/* Oven Glass Reflection Accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/5 to-white/10 pointer-events-none" />
      </div>

      {/* Boot Status Strip & Progress Bar */}
      <div className="w-full max-w-sm mt-6 text-center space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-cream-100">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Preheating the oven…</span>
          </span>
          <span className="font-mono text-amber-300">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-forest-950 rounded-full overflow-hidden border border-amber-500/30">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 transition-all duration-100 ease-out rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <p className="text-[11px] text-[#8fa896] leading-relaxed">
          Calibrating demand weights across hostel messes and batch baking schedules.
        </p>

        {/* Skip button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-1.5 rounded-full text-xs font-medium text-cream-200/70 hover:text-white bg-forest-900/60 hover:bg-forest-900 border border-amber-500/25 transition-all cursor-pointer focus-ring"
          >
            Skip to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
