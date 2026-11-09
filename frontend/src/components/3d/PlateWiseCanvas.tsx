"use client";

import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useAppContext, GraphicsQuality } from "@/context/AppContext";

export interface PlateWiseCanvasProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  };
  shadows?: boolean;
  contactShadows?: boolean;
  contactShadowProps?: {
    position?: [number, number, number];
    opacity?: number;
    scale?: number;
    blur?: number;
    far?: number;
  };
  environmentPreset?: "city" | "sunset" | "apartment" | "forest" | "dawn" | "lobby" | "night" | "park" | "studio" | "warehouse";
  className?: string;
  demand?: boolean;
}

/**
 * Universal PlateWise 3D Canvas
 * Enforces Tier 3 safety & quality rules:
 * - Cookie-driven Graphics quality (Auto / Low / Off) with zero hydration mismatch
 * - ACES Filmic Tone Mapping and capped DPR <= 1.5
 * - drei PerformanceMonitor auto DPR scaling
 * - Frameloop "demand" or "never" when off-screen or tab is backgrounded
 * - Static poster fallback on Off, mobile (<768px), or prefers-reduced-motion
 * - drei HDRI environment preset
 */
export default function PlateWiseCanvas({
  children,
  fallback,
  camera = { position: [0, 2, 4], fov: 45 },
  shadows = true,
  contactShadows = true,
  contactShadowProps = { position: [0, -0.05, 0], opacity: 0.45, scale: 5, blur: 1.5, far: 3 },
  environmentPreset = "city",
  className = "w-full h-full relative",
  demand = false,
}: PlateWiseCanvasProps) {
  const { graphicsQuality } = useAppContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const [dpr, setDpr] = useState<number>(1.2);
  const [isVisible, setIsVisible] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isClientFallback, setIsClientFallback] = useState<boolean | null>(null);

  // Client-side detection for reduced motion & mobile viewport (after mount only)
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const checkFallback = () => {
      const isMobile = window.innerWidth < 640; // Allow desktop/tablet 3D, fallback on compact mobile
      setIsClientFallback(motionQuery.matches || isMobile);
    };

    checkFallback();

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsClientFallback(e.matches || window.innerWidth < 640);
    };
    const handleResize = () => {
      checkFallback();
    };

    motionQuery.addEventListener("change", handleMotionChange);
    window.addEventListener("resize", handleResize);

    // Visibility Observer to pause rendering when scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Tab visibility listener
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  // Determine if static poster fallback should be displayed
  const shouldRenderFallback =
    graphicsQuality === "off" ||
    (isClientFallback === true && graphicsQuality !== "auto");

  if (shouldRenderFallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Frameloop policy: never render if off-screen or tab hidden; demand if requested or low graphics
  const frameloop = !isVisible || !isTabActive
    ? "never"
    : demand || graphicsQuality === "low"
    ? "demand"
    : "always";

  const allowShadows = shadows && graphicsQuality !== "low";

  return (
    <div ref={containerRef} className={className}>
      <Canvas
        camera={camera}
        shadows={allowShadows}
        dpr={dpr}
        frameloop={frameloop}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          antialias: graphicsQuality !== "low",
          powerPreference: "high-performance",
        }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio || 1.2))}
          onDecline={() => setDpr(1.0)}
          flipflops={3}
          onFallback={() => setDpr(0.9)}
        />

        {environmentPreset && (
          <Environment preset={environmentPreset} environmentIntensity={0.65} />
        )}

        {children}

        {contactShadows && graphicsQuality !== "low" && (
          <ContactShadows {...contactShadowProps} />
        )}
      </Canvas>
    </div>
  );
}
