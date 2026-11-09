"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useAppContext } from "@/context/AppContext";
import { Volume2, VolumeX, Sparkles as SparklesIcon, CheckCircle2 } from "lucide-react";

interface TodayCookTrayProps {
  recommendedServings: number;
  isApproved: boolean;
  onApprove?: () => void;
  activeMeal?: string;
}

/**
 * Web Audio API Gentle Success Chime (off by default)
 */
function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Harmonic bell sequence: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.85);
    });
  } catch {
    // Audio context not allowed or unsupported
  }
}

/**
 * Instanced Plate Tray
 * Displays an array of prep plates representing the recommended servings
 */
function InstancedPlates({ count, isApproved }: { count: number; isApproved: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const foodMeshRef = useRef<THREE.InstancedMesh>(null);

  // Instanced grid configuration (e.g. 4 columns x 3 rows)
  const instances = useMemo(() => {
    const cols = 5;
    const rows = 3;
    const total = Math.min(cols * rows, Math.max(6, Math.round(count / 40)));
    const items: { x: number; z: number; scale: number }[] = [];

    const spacingX = 0.65;
    const spacingZ = 0.55;
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (items.length < total) {
          items.push({
            x: startX + c * spacingX,
            z: startZ + r * spacingZ,
            scale: 0.85,
          });
        }
      }
    }
    return items;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!meshRef.current || !foodMeshRef.current) return;

    // Pop animation on approve
    const popScale = isApproved ? 1.0 + Math.sin(Math.min(Math.PI, t * 4)) * 0.15 : 1.0;

    instances.forEach((item, i) => {
      // Plate instance
      dummy.position.set(item.x, 0.02, item.z);
      dummy.scale.set(item.scale * popScale, item.scale * popScale, item.scale * popScale);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Food mound instance on top of plate
      dummy.position.set(item.x, 0.08 + (isApproved ? 0.03 : 0), item.z);
      dummy.scale.set(
        item.scale * 0.7 * popScale,
        item.scale * 0.55 * popScale,
        item.scale * 0.7 * popScale
      );
      dummy.rotation.set(0, (i * 0.4) + t * 0.2, 0);
      dummy.updateMatrix();
      foodMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    foodMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Stainless Institutional Service Tray Base */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.06, 2.0]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Tray Raised Lip */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.7, 0.04, 2.1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Instanced Plates */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instances.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.26, 0.22, 0.04, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </instancedMesh>

      {/* Instanced Food Portions (Rice / Dal mounds) */}
      <instancedMesh
        ref={foodMeshRef}
        args={[undefined, undefined, instances.length]}
        castShadow
      >
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial
          color={isApproved ? "#eab308" : "#f59e0b"}
          roughness={0.5}
          emissive={isApproved ? "#78350f" : "#000000"}
          emissiveIntensity={isApproved ? 0.4 : 0}
        />
      </instancedMesh>
    </group>
  );
}

export default function TodayCookTray({
  recommendedServings = 420,
  isApproved = false,
  onApprove,
  activeMeal = "Lunch",
}: TodayCookTrayProps) {
  const { graphicsQuality } = useAppContext();
  const [chimeEnabled, setChimeEnabled] = useState(false);
  const [celebrateBurst, setCelebrateBurst] = useState(false);

  // Play chime and trigger celebration burst when isApproved triggers
  useEffect(() => {
    if (isApproved) {
      setCelebrateBurst(true);
      if (chimeEnabled) {
        playSuccessChime();
      }
      const timer = setTimeout(() => setCelebrateBurst(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [isApproved, chimeEnabled]);

  return (
    <div className="relative w-full rounded-2xl bg-white border border-[#e3ded0] shadow-xs overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="p-4 border-b border-[#e3ded0] flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F2]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#14211a]">
              3D Prep Tray — {activeMeal} Service Calibration
            </h3>
            <p className="text-[11px] text-[#728479]">
              Instanced batch plates representing{" "}
              <span className="font-mono font-bold text-emerald-700">
                {recommendedServings} recommended servings
              </span>
            </p>
          </div>
        </div>

        {/* Controls: Audio chime toggle + Status badge */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChimeEnabled(!chimeEnabled)}
            className="p-1.5 rounded-lg border border-[#e3ded0] hover:bg-forest-950/5 text-[#728479] hover:text-[#14211a] text-xs transition-colors flex items-center gap-1 cursor-pointer"
            title={chimeEnabled ? "Chime enabled" : "Chime off by default"}
          >
            {chimeEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-mono font-semibold">Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#728479]" />
                <span className="text-[10px] font-mono">Chime Off</span>
              </>
            )}
          </button>

          {isApproved && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 animate-in fade-in">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Baking Batch Authorized</span>
            </span>
          )}
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="w-full h-[220px] sm:h-[260px] relative bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">
        {graphicsQuality !== "off" ? (
          <Canvas
            camera={{ position: [0, 2.2, 3.2], fov: 42 }}
            shadows={graphicsQuality !== "low"}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              antialias: graphicsQuality !== "low",
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={1.2} />
            <directionalLight
              position={[4, 6, 3]}
              intensity={1.8}
              castShadow={graphicsQuality !== "low"}
            />
            <pointLight position={[-3, 2, -1]} intensity={0.5} color="#fed7aa" />

            <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.15}>
              <InstancedPlates
                count={recommendedServings}
                isApproved={isApproved}
              />
            </Float>

            {/* Steam puff & Celebration leaf particles when approved */}
            {celebrateBurst && (
              <>
                {/* Golden & White Steam Sparkles */}
                <Sparkles
                  count={40}
                  scale={[3.2, 1.8, 2.0]}
                  position={[0, 0.4, 0]}
                  size={3.2}
                  speed={0.8}
                  color="#fef08a"
                  opacity={0.8}
                />
                {/* Emerald Confetti Leaves */}
                <Sparkles
                  count={25}
                  scale={[3.5, 2.2, 2.2]}
                  position={[0, 0.6, 0]}
                  size={2.8}
                  speed={0.6}
                  color="#4ade80"
                  opacity={0.85}
                />
              </>
            )}

            <ContactShadows
              position={[0, -0.4, 0]}
              opacity={0.4}
              scale={5}
              blur={1.6}
              far={3}
            />
          </Canvas>
        ) : (
          /* Static 2D Poster */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
              <span className="text-3xl">🍽️</span>
            </div>
            <p className="text-xs font-serif font-bold text-[#14211a]">
              Instanced Batch Rack: {recommendedServings} Servings
            </p>
          </div>
        )}

        {/* Dynamic Overlay Info Banner */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-xs border border-[#e3ded0] font-mono text-[#4a5a50]">
            Capacity Utilization: ~84%
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-xs border border-[#e3ded0] font-mono text-emerald-800 font-semibold">
            Zero Guesswork Waste
          </span>
        </div>
      </div>
    </div>
  );
}
