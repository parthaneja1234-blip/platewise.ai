"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import FoodModel from "@/components/FoodModel";
import { resolveFoodModelId, getProceduralFallback } from "@/lib/assets/modelRoles";
import { useAppContext } from "@/context/AppContext";

export interface PlateItem {
  food_id: string;
  name: string;
  count: number;
  model_id?: string;
  icon_id?: string;
}

interface Plate3DCanvasProps {
  items: PlateItem[];
  variant?: "plate" | "thali";
  saveSuccessBurst?: boolean;
  showOverlayBadges?: boolean;
}

function PlateGeometry({ variant = "plate" }: { variant?: "plate" | "thali" }) {
  if (variant === "thali") {
    return (
      <group position={[0, -0.05, 0]}>
        {/* Stainless Steel Thali Base */}
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[2.3, 2.1, 0.1, 48]} />
          <meshStandardMaterial
            color="#d1d5db"
            metalness={0.88}
            roughness={0.15}
          />
        </mesh>
        {/* Thali Lip */}
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[2.25, 0.05, 16, 48]} />
          <meshStandardMaterial
            color="#e5e7eb"
            metalness={0.92}
            roughness={0.1}
          />
        </mesh>
      </group>
    );
  }

  // Classic Ceramic Plate
  return (
    <group position={[0, -0.05, 0]}>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[2.2, 1.9, 0.12, 48]} />
        <meshStandardMaterial
          color="#fdfbf7"
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      {/* Plate Rim */}
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[2.15, 0.06, 16, 48]} />
        <meshStandardMaterial
          color="#f3ede2"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

/**
 * Animated Dropping Food Piece with settling bounce and settling shadow
 * NO DOM roots or drei <Html> inside to prevent unmounting race conditions
 */
function AnimatedFoodPiece({
  targetPos,
  targetRot,
  modelId,
  foodId,
  count,
}: {
  targetPos: [number, number, number];
  targetRot: [number, number, number];
  modelId?: string;
  foodId: string;
  count: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentY, setCurrentY] = useState(targetPos[1] + 1.2);
  const [hasSettled, setHasSettled] = useState(false);

  // Animate drop-in smoothly on mount
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!hasSettled) {
      const step = delta * 6.5;
      const nextY = THREE.MathUtils.lerp(groupRef.current.position.y, targetPos[1], step);
      groupRef.current.position.y = nextY;

      if (Math.abs(nextY - targetPos[1]) < 0.01) {
        groupRef.current.position.y = targetPos[1];
        setHasSettled(true);
      }
    }
  });

  const effectiveModelId = modelId || resolveFoodModelId(foodId);
  const fallback = getProceduralFallback(foodId);

  return (
    <group
      ref={groupRef}
      position={[targetPos[0], currentY, targetPos[2]]}
      rotation={targetRot}
    >
      {/* Settling item geometry */}
      {effectiveModelId ? (
        <FoodModel
          id={effectiveModelId}
          targetSize={0.72}
          groundBase
          castShadow
        />
      ) : (
        /* Procedural Fallback Shape */
        <mesh position={[0, 0.12, 0]} castShadow>
          {fallback.shape === "sphere" ? (
            <sphereGeometry args={[fallback.dimensions[0], 16, 16]} />
          ) : fallback.shape === "box" ? (
            <boxGeometry args={fallback.dimensions} />
          ) : (
            <cylinderGeometry
              args={[
                fallback.dimensions[0],
                fallback.dimensions[1] || fallback.dimensions[0],
                fallback.dimensions[2] || 0.1,
                24,
              ]}
            />
          )}
          <meshStandardMaterial color={fallback.color} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

function FoodArrangement({ items }: { items: PlateItem[] }) {
  const totalSlots = items.reduce((acc, it) => acc + it.count, 0);

  if (totalSlots === 0) {
    return null;
  }

  let currentSlot = 0;
  const elements: React.ReactNode[] = [];

  items.forEach((it) => {
    for (let c = 0; c < it.count; c++) {
      const angle = (currentSlot / Math.max(1, totalSlots)) * Math.PI * 2;
      const radius = totalSlots === 1 ? 0 : 1.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const key = `${it.food_id}-${c}`;

      elements.push(
        <AnimatedFoodPiece
          key={key}
          targetPos={[x, 0.05, z]}
          targetRot={[0, angle + Math.PI / 4, 0]}
          modelId={it.model_id}
          foodId={it.food_id}
          count={it.count}
        />
      );
      currentSlot++;
    }
  });

  return <group>{elements}</group>;
}

export default function Plate3DCanvas({
  items,
  variant = "plate",
  saveSuccessBurst = false,
  showOverlayBadges = true,
}: Plate3DCanvasProps) {
  const { graphicsQuality } = useAppContext();

  return (
    <div className="w-full h-full min-h-[220px] sm:min-h-[300px] relative select-none">
      {/* DOM Count Badge Overlay outside Canvas */}
      {showOverlayBadges && items.length > 0 && (
        <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1 pointer-events-none z-10">
          {items.map((it) => (
            <div
              key={it.food_id}
              className="px-2 py-0.5 rounded-full bg-forest-950/85 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono text-amber-200 shadow-md flex items-center gap-1"
            >
              <span className="font-medium text-[#FAF8F2]">{it.name}</span>
              <span className="font-bold text-emerald-400">×{it.count}</span>
            </div>
          ))}
        </div>
      )}

      {graphicsQuality !== "off" ? (
        <Canvas
          camera={{ position: [0, 4.3, 4.1], fov: 42 }}
          shadows={graphicsQuality !== "low"}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            antialias: graphicsQuality !== "low",
            powerPreference: "high-performance",
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <ambientLight intensity={1.2} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.8}
            castShadow={graphicsQuality !== "low"}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={20}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
          />
          <pointLight position={[-4, 3, -3]} intensity={0.6} color="#fde68a" />

          <Float speed={1.2} rotationIntensity={0.10} floatIntensity={0.14} scale={0.78}>
            <PlateGeometry variant={variant} />
            <FoodArrangement items={items} />
          </Float>

          {/* Success Burst on Save Plate */}
          {saveSuccessBurst && (
            <>
              {/* Steam puff */}
              <Sparkles
                count={35}
                scale={[2.6, 1.8, 2.6]}
                position={[0, 0.5, 0]}
                size={3.0}
                speed={0.9}
                color="#fef08a"
                opacity={0.8}
              />
              {/* Confetti leaves */}
              <Sparkles
                count={25}
                scale={[3.0, 2.2, 3.0]}
                position={[0, 0.8, 0]}
                size={2.6}
                speed={0.7}
                color="#52b788"
                opacity={0.85}
              />
            </>
          )}

          <ContactShadows
            position={[0, -0.2, 0]}
            opacity={0.45}
            scale={5.5}
            blur={1.8}
            far={3}
          />

          <OrbitControls
            enablePan={false}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={2.5}
            maxDistance={6.0}
          />
        </Canvas>
      ) : (
        /* Static 2D Poster Fallback for "Off" */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#142814]/60 rounded-2xl">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <span className="text-3xl">🍛</span>
          </div>
          <p className="text-sm font-serif font-bold text-[#faf8f2]">
            2D Plate Simulation ({items.reduce((acc, it) => acc + it.count, 0)} Items)
          </p>
          <p className="text-xs text-[#8fa896] mt-1">
            3D WebGL paused (Graphics: OFF)
          </p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-[#f5eedc]/70 pointer-events-none border border-white/10">
        Drag to rotate 3D plate &bull; Scroll to zoom
      </div>
    </div>
  );
}
