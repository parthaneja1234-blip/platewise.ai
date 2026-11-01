"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import FoodModel from "@/components/FoodModel";
import {
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Box,
  Cpu,
  Layers,
  Sparkles,
  FileCode,
} from "lucide-react";

export default function CreditsSection() {
  const [creditsText, setCreditsText] = useState<string>("");
  const [showFullMarkdown, setShowFullMarkdown] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>("loaf-round");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/models/CREDITS.md")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load CREDITS.md");
        return res.text();
      })
      .then((text) => {
        setCreditsText(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn("[CreditsSection] Fetch error:", err);
        // Fallback default
        setCreditsText(
          "# 3D Model Credits & Attribution\n\nCC0 1.0 Universal - Kenney Food Kit (kenney.nl)"
        );
        setIsLoading(false);
      });
  }, []);

  const sampleModels = [
    { id: "loaf-round", label: "Artisan Loaf" },
    { id: "apple", label: "Apple" },
    { id: "cake-birthday", label: "Birthday Cake" },
    { id: "burger", label: "Burger" },
    { id: "plate-dinner", label: "Dinner Plate" },
  ];

  return (
    <section
      id="credits"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#102410] to-[#0c180c] border-t border-amber-500/15"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-950/70 border border-amber-500/30 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Source & Creative Commons</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF6EE] mb-4">
            3D Asset Attribution &amp;{" "}
            <span className="italic font-serif text-amber-400">Credits</span>
          </h2>
          <p className="text-sm sm:text-base text-[#EDE6D6]/70 font-light leading-relaxed">
            PlateWise AI utilizes lightweight 3D digital twins to simulate cafeteria prep, tray
            composition, and plate waste. All food models are licensed under Creative Commons Zero
            (CC0) and optimized via our automated asset pipeline.
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          {/* Left: CC0 Kenney Kit Card */}
          <div className="lg:col-span-7 bg-[#142814]/90 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-black text-xl">
                  K
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#FAF6EE]">Kenney Food Kit</h3>
                  <a
                    href="https://kenney.nl/assets/food-kit"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <span>kenney.nl/assets/food-kit</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                CC0 1.0 Universal (Public Domain)
              </span>
            </div>

            <p className="text-sm text-[#EDE6D6]/80 font-light leading-relaxed mb-6">
              Created by <strong>Kenney</strong> (&ldquo;Asset Jesus&rdquo;), this comprehensive 3D kit
              contains 200 low-poly food items, dining plates, bakery breads, cookware, and fresh
              produce. Dedicated to the public domain with zero restrictions on personal or
              commercial utilization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-amber-500/15">
              <div className="p-3.5 rounded-xl bg-forest-950/60 border border-amber-500/10">
                <div className="text-[11px] text-[#EDE6D6]/60">Models Count</div>
                <div className="font-serif text-lg font-bold text-[#FAF6EE] mt-0.5">200 Items</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Dishes, Breads, Produce</div>
              </div>
              <div className="p-3.5 rounded-xl bg-forest-950/60 border border-amber-500/10">
                <div className="text-[11px] text-[#EDE6D6]/60">Optimization</div>
                <div className="font-serif text-lg font-bold text-emerald-400 mt-0.5">-47.3%</div>
                <div className="text-[10px] text-[#EDE6D6]/50 mt-0.5">1.69 MB total footprint</div>
              </div>
              <div className="p-3.5 rounded-xl bg-forest-950/60 border border-amber-500/10">
                <div className="text-[11px] text-[#EDE6D6]/60">Textures</div>
                <div className="font-serif text-lg font-bold text-amber-300 mt-0.5">WebP 1024px</div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">100% Embedded GLB</div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dev/models"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-forest-950 shadow-md transition-all flex items-center gap-1.5"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Open 3D Dev Gallery (/dev/models)</span>
              </Link>
              <button
                onClick={() => setShowFullMarkdown(!showFullMarkdown)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-forest-900/80 hover:bg-forest-800 text-[#FAF6EE] border border-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{showFullMarkdown ? "Hide CREDITS.md" : "View CREDITS.md"}</span>
                {showFullMarkdown ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Right: Interactive 3D Sample Preview */}
          <div className="lg:col-span-5 bg-[#142814]/90 border border-amber-500/20 rounded-3xl p-6 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs">
              <span className="text-[#EDE6D6]/70 font-mono">Live Interactive Sample</span>
              <span className="text-amber-400 font-mono">{activeModel}</span>
            </div>

            {/* 3D Viewport */}
            <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-b from-[#183218] to-[#0c180c] border border-amber-500/15 overflow-hidden">
              <Canvas
                dpr={[1, 1.5]}
                camera={{ position: [0, 1.2, 2.0], fov: 42 }}
                gl={{ antialias: true, alpha: true }}
              >
                <ambientLight intensity={0.9} />
                <directionalLight position={[4, 6, 3]} intensity={1.4} />
                <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#fed7aa" />

                <Center top>
                  <FoodModel id={activeModel} normalize targetSize={1.0} groundBase />
                </Center>

                <OrbitControls
                  enableZoom={false}
                  autoRotate
                  autoRotateSpeed={3}
                  enableDamping
                  dampingFactor={0.08}
                  maxPolarAngle={Math.PI / 2 + 0.1}
                />
              </Canvas>

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/60 text-[#EDE6D6]/70 backdrop-blur-md">
                  Drag to rotate • OrbitControls
                </span>
              </div>
            </div>

            {/* Sample Selector Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 w-full">
              {sampleModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModel(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeModel === m.id
                      ? "bg-amber-500 text-forest-950 font-semibold shadow-md"
                      : "bg-forest-950/70 text-[#EDE6D6]/70 hover:text-[#FAF6EE] border border-cream-200/10"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Full Markdown Viewer for /models/CREDITS.md */}
        {showFullMarkdown && (
          <div className="bg-[#0f220f] border border-amber-500/25 rounded-2xl p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-500/15">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <FileCode className="w-4 h-4" />
                <span>/frontend/public/models/CREDITS.md</span>
              </div>
              <button
                onClick={() => setShowFullMarkdown(false)}
                className="text-xs text-[#EDE6D6]/60 hover:text-[#FAF6EE]"
              >
                Close
              </button>
            </div>
            <pre className="text-xs sm:text-sm font-mono text-[#EDE6D6]/85 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {creditsText || "Loading credits file..."}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
