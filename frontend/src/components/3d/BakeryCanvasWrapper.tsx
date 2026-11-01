"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import Three.js scene with ssr: false
const BakeryScene = dynamic(() => import("./BakeryScene"), {
  ssr: false,
  loading: () => <BakeryStaticFallback loading={true} />,
});

// Accessible & Mobile-optimized Static Visual Fallback
function BakeryStaticFallback({ loading = false }: { loading?: boolean }) {
  return (
    <div className="relative w-full h-[460px] md:h-[580px] rounded-3xl bg-gradient-to-b from-[#142814] via-[#1a3a1a] to-[#122812] border border-amber-900/30 overflow-hidden flex flex-col items-center justify-center p-8 text-center shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

      {/* Decorative Kitchen Cloche / Oven Illustration */}
      <div className="relative z-10 w-44 h-44 mb-6 rounded-full bg-gradient-to-tr from-amber-950/60 to-forest-900/40 border border-amber-500/30 flex items-center justify-center shadow-inner">
        <div className="w-32 h-32 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
          <svg
            className="w-20 h-20 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Cloche / Oven dome */}
            <path d="M12 4v2" />
            <path d="M4 18h16" />
            <path d="M4 18a8 8 0 0 1 16 0" />
            <circle cx="12" cy="4" r="1.5" fill="currentColor" />
            {/* Heat lines */}
            <path d="M8 14c.5-1 1.5-1 2 0s1.5 1 2 0 1.5-1 2 0" strokeDasharray="1 1" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-sm">
        <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider uppercase text-amber-300 bg-amber-950/80 border border-amber-500/30 rounded-full">
          {loading ? "Warming Up The Kitchen..." : "Artisan Demand Forecasting"}
        </span>
        <h3 className="font-serif text-2xl text-cream-100 font-semibold mb-2">
          Precision Bakery & Cafeteria Intelligence
        </h3>
        <p className="text-sm text-cream-200/80 leading-relaxed">
          {loading
            ? "Preparing real-time 3D simulation of institutional bakery prep..."
            : "Optimizing batch sizes, proofing schedules, and reducing plate waste across university kitchens."}
        </p>
      </div>
    </div>
  );
}

export default function BakeryCanvasWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [shouldFallback, setShouldFallback] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = window.innerWidth < 768;

    if (motionQuery.matches || isMobile) {
      setShouldFallback(true);
    } else {
      setShouldFallback(false);
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setShouldFallback(e.matches || window.innerWidth < 768);
    };

    motionQuery.addEventListener("change", handleMotionChange);

    // 2. Performance: Pause rendering when off screen using IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[460px] md:h-[580px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#142614] via-[#1a3a1a] to-[#122412] border border-amber-900/30 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
    >
      {shouldFallback === true ? (
        <BakeryStaticFallback loading={false} />
      ) : (
        <BakeryScene isVisible={isVisible} />
      )}
    </div>
  );
}
