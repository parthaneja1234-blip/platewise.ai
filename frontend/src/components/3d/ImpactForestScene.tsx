"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Sparkles, Float } from "@react-three/drei";
import * as THREE from "three";
import { useAppContext } from "@/context/AppContext";
import { MODEL_ROLES } from "@/lib/assets/modelRoles";
import { formatNumber } from "@/lib/formatters";

interface ImpactForestSceneProps {
  co2eAvoidedKg?: number;
}

interface TreeData {
  x: number;
  z: number;
  scale: number;
  height: number;
  swaySpeed: number;
  swayOffset: number;
  trunkColor: string;
  canopyColor: string;
  canopyShape: "cone" | "sphere";
}

function ProceduralTree({ data, growth }: { data: TreeData; growth: number }) {
  const canopyRef = useRef<THREE.Group>(null);
  const currentScale = data.scale * growth;

  useFrame((state) => {
    if (!canopyRef.current) return;
    const t = state.clock.getElapsedTime();
    canopyRef.current.rotation.z =
      Math.sin(t * data.swaySpeed + data.swayOffset) * 0.04;
    canopyRef.current.rotation.x =
      Math.cos(t * data.swaySpeed * 0.8 + data.swayOffset) * 0.03;
  });

  return (
    <group position={[data.x, 0, data.z]} scale={[currentScale, currentScale, currentScale]}>
      {/* Tree Trunk */}
      <mesh position={[0, data.height * 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.12, data.height * 0.7, 8]} />
        <meshStandardMaterial color={data.trunkColor} roughness={0.8} />
      </mesh>

      {/* Canopy with gentle wind sway */}
      <group ref={canopyRef} position={[0, data.height * 0.65, 0]}>
        {data.canopyShape === "cone" ? (
          <>
            {/* Lower Tier Cone */}
            <mesh position={[0, 0, 0]} castShadow>
              <coneGeometry args={[0.48, 0.65, 7]} />
              <meshStandardMaterial color={data.canopyColor} roughness={0.6} />
            </mesh>
            {/* Mid Tier Cone */}
            <mesh position={[0, 0.32, 0]} castShadow>
              <coneGeometry args={[0.38, 0.55, 7]} />
              <meshStandardMaterial color={data.canopyColor} roughness={0.55} />
            </mesh>
            {/* Top Tier Cone */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[0.26, 0.45, 7]} />
              <meshStandardMaterial color={data.canopyColor} roughness={0.5} />
            </mesh>
          </>
        ) : (
          /* Round Canopy */
          <mesh position={[0, 0.3, 0]} castShadow>
            <icosahedronGeometry args={[0.42, 1]} />
            <meshStandardMaterial color={data.canopyColor} roughness={0.6} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function ForestGround() {
  return (
    <group position={[0, -0.05, 0]}>
      {/* Grassy Meadow Disc */}
      <mesh receiveShadow>
        <cylinderGeometry args={[3.8, 3.6, 0.1, 48]} />
        <meshStandardMaterial color="#1b3a24" roughness={0.85} />
      </mesh>
      {/* Subtle stone pathway / clearing */}
      <mesh position={[0, 0.055, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.85, 32]} />
        <meshStandardMaterial color="#2d4a36" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function ImpactForestScene({ co2eAvoidedKg = 21000 }: ImpactForestSceneProps) {
  const { graphicsQuality } = useAppContext();

  // Calculate dynamic tree count based on CO2e avoided (approx 1 mature tree per 22kg CO2e / yr)
  const equivalentTrees = Math.max(12, Math.min(48, Math.round(co2eAvoidedKg / 450)));

  const trees = useMemo<TreeData[]>(() => {
    const list: TreeData[] = [];
    const variants = MODEL_ROLES.impactForest.treeVariants;

    for (let i = 0; i < equivalentTrees; i++) {
      // Polar distribution around center clearing
      const angle = (i / equivalentTrees) * Math.PI * 2 + (i % 3) * 0.4;
      const radius = 0.9 + ((i * 7) % 11) * 0.22;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const variant = variants[i % variants.length];

      list.push({
        x,
        z,
        scale: 0.75 + ((i % 5) * 0.08),
        height: 1.0 + ((i % 4) * 0.18),
        swaySpeed: 1.2 + ((i % 3) * 0.3),
        swayOffset: i * 0.8,
        trunkColor: variant.trunkColor,
        canopyColor: variant.canopyColor,
        canopyShape: variant.shape,
      });
    }
    return list;
  }, [equivalentTrees]);

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#0a180d] via-[#102413] to-[#0e2412] border border-emerald-500/25 shadow-xl overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-emerald-500/15 flex flex-wrap items-center justify-between gap-3 bg-forest-950/40 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-serif text-sm font-bold text-[#FAF8F2]">
              Living Carbon Offset Forest
            </h3>
          </div>
          <p className="text-[11px] text-[#8fa896] mt-0.5">
            Procedural forest growth calibrated to{" "}
            <span className="font-mono text-emerald-300 font-bold">
              {formatNumber(co2eAvoidedKg / 1000, 1)} Metric Tons CO₂e
            </span>{" "}
            diverted
          </p>
        </div>

        <div className="flex items-center gap-2 bg-forest-900/60 px-3 py-1 rounded-xl border border-emerald-500/20 text-xs">
          <span className="text-[#8fa896]">Forest Density:</span>
          <span className="font-mono font-bold text-emerald-300">
            {trees.length} Trees (~{Math.round(co2eAvoidedKg / 22)} tree-years)
          </span>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="w-full h-[280px] sm:h-[340px] relative select-none">
        {graphicsQuality !== "off" ? (
          <Canvas
            camera={{ position: [0, 2.8, 4.2], fov: 45 }}
            shadows={graphicsQuality !== "low"}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              antialias: graphicsQuality !== "low",
              powerPreference: "high-performance",
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <ambientLight intensity={1.1} />
            <directionalLight
              position={[5, 8, 4]}
              intensity={1.7}
              castShadow={graphicsQuality !== "low"}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <pointLight position={[-3, 2, -3]} intensity={0.5} color="#52b788" />

            <Float speed={1.0} rotationIntensity={0.06} floatIntensity={0.1}>
              <ForestGround />
              {trees.map((t, idx) => (
                <ProceduralTree key={idx} data={t} growth={1.0} />
              ))}
            </Float>

            {/* Glowing Firefly / Forest Biome Sparkles */}
            <Sparkles
              count={30}
              scale={[5, 2.5, 5]}
              position={[0, 0.8, 0]}
              size={2.4}
              speed={0.4}
              color="#52b788"
              opacity={0.65}
            />

            <ContactShadows
              position={[0, -0.15, 0]}
              opacity={0.5}
              scale={8}
              blur={1.8}
              far={4}
            />

            <OrbitControls
              enablePan={false}
              maxPolarAngle={Math.PI / 2.2}
              minDistance={3.0}
              maxDistance={7.0}
            />
          </Canvas>
        ) : (
          /* Static 2D Poster Fallback for "Off" */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#102413]">
            <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <span className="text-3xl">🌲</span>
            </div>
            <p className="font-serif text-sm font-bold text-[#FAF8F2]">
              Living Carbon Offset Forest ({trees.length} Trees)
            </p>
            <p className="text-xs text-[#8fa896] mt-1">
              3D WebGL paused (Graphics: OFF)
            </p>
          </div>
        )}

        {/* Interaction hint */}
        <div className="absolute bottom-2 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-cream-100/70 pointer-events-none border border-white/10">
          Rotate / zoom to tour your campus carbon grove
        </div>
      </div>
    </div>
  );
}
