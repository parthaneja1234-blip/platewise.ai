"use client";

import React, { Component, ReactNode, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { MeshoptDecoder } from "three-stdlib";
import { MODEL_REGISTRY_MAP, normalizeModel } from "@/lib/assets/modelRegistry";

// Pre-configure drei decoder extension
const decoder = typeof MeshoptDecoder === "function" ? MeshoptDecoder() : MeshoptDecoder;

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[FoodModel] Failed to load 3D model:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Placeholder shown while the GLB model is being downloaded and decoded.
 */
function ModelLoadingPlaceholder({ size = 0.8 }: { size?: number }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[size, size * 0.6, size]} />
        <meshStandardMaterial
          color="#d97706"
          wireframe
          transparent
          opacity={0.35}
          roughness={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Safe fallback shown if model is missing from registry or file fails to load.
 */
function ModelSafeFallback({ label = "Model not found" }: { label?: string }) {
  return (
    <group>
      {/* Plate-like base placeholder */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.55, 0.45, 0.08, 24]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Stylized geometric stand */}
      <mesh position={[0, 0.25, 0]}>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial
          color="#f59e0b"
          roughness={0.3}
          metalness={0.5}
          emissive="#78350f"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

interface ModelInstanceProps {
  filePath: string;
  normalize?: boolean;
  targetSize?: number;
  groundBase?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

function ModelInstance({
  filePath,
  normalize = true,
  targetSize = 1.0,
  groundBase = true,
  castShadow = true,
  receiveShadow = true,
}: ModelInstanceProps) {
  // Pass meshopt decoder hookup to useGLTF
  const { scene } = useGLTF(
    filePath,
    false, // draco
    true, // meshopt flag
    (loader) => {
      loader.setMeshoptDecoder(decoder);
    }
  );

  // Clone scene so multiple instances don't cross-contaminate transforms or materials
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    if (normalize) {
      normalizeModel(clone, targetSize, groundBase);
    }

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      }
    });

    return clone;
  }, [scene, normalize, targetSize, groundBase, castShadow, receiveShadow]);

  return <primitive object={clonedScene} />;
}

export interface FoodModelProps {
  id: string;
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  normalize?: boolean;
  targetSize?: number;
  groundBase?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Reusable <FoodModel id="apple" /> 3D component.
 * Integrates useGLTF with Meshopt decoder, Suspense loading fallback,
 * and safe error boundary fallback.
 */
export default function FoodModel({
  id,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  normalize = true,
  targetSize = 1.0,
  groundBase = true,
  castShadow = true,
  receiveShadow = true,
}: FoodModelProps) {
  const metadata = MODEL_REGISTRY_MAP[id];

  const tupleScale: [number, number, number] =
    typeof scale === "number" ? [scale, scale, scale] : scale;

  // If model is missing from registry, render safe fallback directly
  if (!metadata) {
    return (
      <group position={position} rotation={rotation} scale={tupleScale}>
        <ModelSafeFallback label={`Model "${id}" not found`} />
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation} scale={tupleScale}>
      <ModelErrorBoundary fallback={<ModelSafeFallback label={metadata.displayName} />}>
        <Suspense fallback={<ModelLoadingPlaceholder size={targetSize} />}>
          <ModelInstance
            filePath={metadata.filePath}
            normalize={normalize}
            targetSize={targetSize}
            groundBase={groundBase}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  );
}

// Preload helper
FoodModel.preload = (id: string) => {
  const meta = MODEL_REGISTRY_MAP[id];
  if (meta) {
    useGLTF.preload(meta.filePath, false, true, (loader) => {
      loader.setMeshoptDecoder(decoder);
    });
  }
};
