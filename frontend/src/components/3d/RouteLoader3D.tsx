"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import FoodModel from "@/components/FoodModel";
import { MODEL_ROLES } from "@/lib/assets/modelRoles";
import { useAppContext } from "@/context/AppContext";

function SpinningFood() {
  const groupRef = useRef<THREE.Group>(null);
  const modelId = MODEL_ROLES.routeLoader.primaryModelId;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <FoodModel
          id={modelId}
          targetSize={1.1}
          groundBase={false}
          castShadow
        />
      </Float>
    </group>
  );
}

function LoaderFallback() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-spin">
      <span className="text-2xl">🥐</span>
    </div>
  );
}

export default function RouteLoader3D() {
  const { graphicsQuality } = useAppContext();

  return (
    <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-40 h-40 relative flex items-center justify-center">
        {graphicsQuality !== "off" ? (
          <Canvas
            camera={{ position: [0, 1.2, 2.5], fov: 42 }}
            shadows
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              antialias: true,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={1.4} />
            <directionalLight position={[3, 5, 2]} intensity={1.5} castShadow />
            <pointLight position={[-2, 2, -2]} intensity={0.5} color="#fed7aa" />

            <Suspense fallback={null}>
              <SpinningFood />
            </Suspense>

            <ContactShadows
              position={[0, -0.65, 0]}
              opacity={0.35}
              scale={2.5}
              blur={1.6}
              far={2}
            />
          </Canvas>
        ) : (
          <LoaderFallback />
        )}
      </div>

      <div className="mt-3 space-y-1.5 max-w-xs">
        <div className="flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-semibold text-[#14211a]">
            Loading mess intelligence…
          </p>
        </div>
        <p className="text-[11px] text-[#728479] font-mono">
          Syncing attendance models and batch plans
        </p>
      </div>
    </div>
  );
}
