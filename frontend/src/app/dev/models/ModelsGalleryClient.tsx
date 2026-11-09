"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center } from "@react-three/drei";
import {
  MODEL_REGISTRY,
  MODEL_CATEGORIES,
  ModelMetadata,
  ModelCategory,
} from "@/lib/assets/modelRegistry";
import FoodModel from "@/components/FoodModel";
import { formatNumber } from "@/lib/formatters";
import {
  Search,
  Box,
  Layers,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Eye,
} from "lucide-react";

/**
 * Single 3D Preview Canvas with soft studio lighting & OrbitControls.
 * Performance optimized for MacBook Air:
 * - DPR capped to [1, 1.5]
 * - Zoom disabled on card preview so page scroll is uninterrupted
 * - Damped controls
 */
function StudioPreview({
  id,
  isHovered,
  autoRotate = false,
  wireframe = false,
}: {
  id: string;
  isHovered: boolean;
  autoRotate?: boolean;
  wireframe?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.2, 2.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: isHovered ? "auto" : "none" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 3]} intensity={1.3} castShadow={false} />
      <directionalLight position={[-4, 3, -3]} intensity={0.45} color="#fef3c7" />
      <pointLight position={[0, -2, 0]} intensity={0.2} color="#94a3b8" />

      <Center top>
        <FoodModel
          id={id}
          normalize
          targetSize={1.0}
          groundBase
        />
      </Center>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={autoRotate || isHovered}
        autoRotateSpeed={2.5}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 + 0.1}
        minPolarAngle={Math.PI / 6}
      />
    </Canvas>
  );
}

/**
 * Lazy-loaded card that only mounts a 3D WebGL Canvas when visible in the viewport.
 * This guarantees smooth 60fps on MacBook Air and prevents exceeding browser WebGL context limits.
 */
function ModelCard({
  model,
  onInspect,
}: {
  model: ModelMetadata;
  onInspect: (model: ModelMetadata) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use IntersectionObserver with a 150px root margin for smooth scrolling
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "150px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`<FoodModel id="${model.id}" />`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryColor: Record<ModelCategory, string> = {
    dish: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    bread: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    dessert: "bg-pink-950/60 text-pink-300 border-pink-500/30",
    drink: "bg-sky-950/60 text-sky-300 border-sky-500/30",
    plate: "bg-indigo-950/60 text-indigo-300 border-indigo-500/30",
    kitchen: "bg-zinc-800/80 text-zinc-300 border-zinc-600/30",
    other: "bg-lime-950/60 text-lime-300 border-lime-500/30",
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onInspect(model)}
      className="group relative rounded-2xl bg-[#142814]/90 border border-amber-500/20 hover:border-amber-400/50 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* 3D Viewport or Lightweight Placeholder */}
      <div className="relative w-full aspect-square bg-gradient-to-b from-[#183218] to-[#0f200f] overflow-hidden">
        {isVisible ? (
          <StudioPreview id={model.id} isHovered={isHovered} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-500/30 gap-2">
            <Box className="w-10 h-10 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider">PREVIEW READY</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-md uppercase tracking-wider ${
              categoryColor[model.category] || "bg-zinc-800 text-zinc-300 border-zinc-700"
            }`}
          >
            {model.category}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-black/60 backdrop-blur-md text-[#EDE6D6]/80 border border-cream-200/10">
            {formatNumber(model.triangles)} Δ
          </span>
        </div>

        {/* Quick Action Overlay on Hover */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleCopy}
            title="Copy component code"
            className="p-2 rounded-xl bg-[#1a3a1a]/90 hover:bg-amber-500 hover:text-forest-950 text-amber-300 border border-amber-500/30 shadow-md backdrop-blur-md transition-all text-xs flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspect(model);
            }}
            title="Full inspection"
            className="p-2 rounded-xl bg-[#1a3a1a]/90 hover:bg-amber-500 hover:text-forest-950 text-amber-300 border border-amber-500/30 shadow-md backdrop-blur-md transition-all text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between border-t border-amber-500/15 bg-[#122412]/80">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#FAF6EE] group-hover:text-amber-300 transition-colors line-clamp-1">
            {model.displayName}
          </h3>
          <p className="text-xs font-mono text-[#EDE6D6]/50 mt-0.5">{model.id}</p>
        </div>

        <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between text-xs">
          <span className="text-[#EDE6D6]/60">File size</span>
          <span className="font-mono text-amber-400 font-medium">{model.sizeKB} KB</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Fullscreen Interactive Inspector Modal with studio lighting & OrbitControls.
 */
function ModelInspectorModal({
  model,
  onClose,
}: {
  model: ModelMetadata;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [targetSize, setTargetSize] = useState(1.0);
  const [groundBase, setGroundBase] = useState(true);

  const snippet = `<FoodModel\n  id="${model.id}"\n  targetSize={${targetSize}}\n  groundBase={${groundBase}}\n/>`;

  const copyCode = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#142814] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-forest-900/90 text-[#FAF6EE] hover:bg-amber-500 hover:text-forest-950 border border-amber-500/30 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Interactive 3D Canvas */}
        <div className="relative flex-1 min-h-[380px] md:min-h-[540px] bg-gradient-to-b from-[#183218] to-[#0c180c]">
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 1.4, 2.5], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 7, 4]} intensity={1.5} castShadow />
            <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#fed7aa" />
            <pointLight position={[0, -2, 0]} intensity={0.3} color="#94a3b8" />

            <Center top>
              <FoodModel
                id={model.id}
                normalize
                targetSize={targetSize}
                groundBase={groundBase}
              />
            </Center>

            {/* Subtle grid on the floor */}
            <gridHelper args={[8, 16, "#f59e0b", "#1f3c1f"]} position={[0, -0.01, 0]} />

            <OrbitControls
              enableZoom
              enablePan
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              enableDamping
              dampingFactor={0.06}
              maxPolarAngle={Math.PI / 2 + 0.15}
            />
          </Canvas>

          {/* Quick 3D overlay controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                autoRotate
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-forest-950/70 text-[#EDE6D6]/70 border-cream-200/10"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{autoRotate ? "Rotating" : "Paused"}</span>
            </button>
            <button
              onClick={() => setGroundBase(!groundBase)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                groundBase
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-forest-950/70 text-[#EDE6D6]/70 border-cream-200/10"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{groundBase ? "Ground Base" : "Center Y"}</span>
            </button>
          </div>
        </div>

        {/* Right: Metadata & Code Panel */}
        <div className="w-full md:w-96 p-6 md:p-8 bg-[#0f220f] border-t md:border-t-0 md:border-l border-amber-500/20 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/30">
                {model.category}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-forest-950/80 text-[#EDE6D6]/70 border border-cream-200/10">
                {formatNumber(model.triangles)} Triangles
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#FAF6EE] mb-1">
              {model.displayName}
            </h2>
            <p className="text-xs font-mono text-[#EDE6D6]/60 mb-6">{model.id}</p>

            {/* Spec Table */}
            <div className="space-y-2.5 text-xs bg-forest-950/60 p-4 rounded-xl border border-amber-500/15 mb-6">
              <div className="flex justify-between">
                <span className="text-[#EDE6D6]/60">Optimized Size:</span>
                <span className="font-mono text-amber-400 font-semibold">{model.sizeKB} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#EDE6D6]/60">Polycount:</span>
                <span className="font-mono text-[#FAF6EE]">{model.triangles} faces</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#EDE6D6]/60">Texture:</span>
                <span className="text-emerald-300">Self-Contained (WebP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#EDE6D6]/60">Compression:</span>
                <span className="text-emerald-300">Meshopt Level Medium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#EDE6D6]/60">File Path:</span>
                <span className="font-mono text-[#EDE6D6]/80 text-[11px] truncate max-w-[170px]">
                  {model.filePath}
                </span>
              </div>
            </div>

            {/* Size Slider */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-[#EDE6D6]/70 mb-2">
                <span>Bounding Box Target Size</span>
                <span className="font-mono text-amber-300">{formatNumber(targetSize, 1)} units</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={targetSize}
                onChange={(e) => setTargetSize(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Code Snippet */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#EDE6D6]/70 mb-2">
                <span>Usage Snippet</span>
                <button
                  onClick={copyCode}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSX"}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-forest-950 text-xs font-mono text-amber-200 border border-amber-500/20 overflow-x-auto leading-relaxed">
                {snippet}
              </pre>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-500/15 text-[11px] text-[#EDE6D6]/50 flex items-center justify-between">
            <span>License: CC0 1.0 (Public Domain)</span>
            <Link
              href="/welcome"
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              Credits & Legal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Client Component for /dev/models
 */
export default function ModelsGalleryClient() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inspectingModel, setInspectingModel] = useState<ModelMetadata | null>(null);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MODEL_REGISTRY.length };
    for (const m of MODEL_REGISTRY) {
      counts[m.category] = (counts[m.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filter models based on search term & category
  const filteredModels = useMemo(() => {
    const query = search.toLowerCase().trim();
    return MODEL_REGISTRY.filter((m) => {
      const matchesCat = selectedCategory === "all" || m.category === selectedCategory;
      const matchesQuery =
        !query ||
        m.displayName.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  }, [search, selectedCategory]);

  const totalSizeKB = useMemo(() => {
    return formatNumber(MODEL_REGISTRY.reduce((acc, m) => acc + m.sizeKB, 0), 1);
  }, []);

  return (
    <div className="min-h-screen bg-[#102410] text-[#FAF6EE] selection:bg-amber-500 selection:text-forest-950">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0d1e0d]/90 backdrop-blur-md border-b border-amber-500/15 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-forest-950 font-serif font-black text-xl shadow-lg">
              3D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF6EE]">
                  Food Models Gallery
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Dev Only
                </span>
              </div>
              <p className="text-xs text-[#EDE6D6]/60">
                200 self-contained GLBs • Meshopt + WebP 1024px • Normalized bounding boxes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-forest-900/80 hover:bg-forest-800 text-[#FAF6EE] border border-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Back to App</span>
            </Link>
            <Link
              href="/welcome"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <span>Credits & CC0</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric summary banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-[#142814]/80 border border-amber-500/15">
            <div className="text-xs text-[#EDE6D6]/60">Registered Models</div>
            <div className="font-serif text-2xl font-bold text-[#FAF6EE] mt-1">200</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">100% Optimized</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#142814]/80 border border-amber-500/15">
            <div className="text-xs text-[#EDE6D6]/60">Optimized Footprint</div>
            <div className="font-serif text-2xl font-bold text-amber-300 mt-1">1.69 MB</div>
            <div className="text-[11px] text-[#EDE6D6]/50 mt-0.5">Down from 3.20 MB (-47%)</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#142814]/80 border border-amber-500/15">
            <div className="text-xs text-[#EDE6D6]/60">Texture Strategy</div>
            <div className="font-serif text-2xl font-bold text-[#FAF6EE] mt-1">Self-Contained</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Embedded WebP 1024px</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#142814]/80 border border-amber-500/15">
            <div className="text-xs text-[#EDE6D6]/60">MacBook Air Tuning</div>
            <div className="font-serif text-2xl font-bold text-[#FAF6EE] mt-1">Viewport Capped</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">DPR 1.5, Lazy Canvases</div>
          </div>
        </div>

        {/* Filter Controls: Search and Categories */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60" />
            <input
              type="text"
              placeholder="Search by name, category, or ID (e.g. apple, burger, plate)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#142814] border border-amber-500/25 text-[#FAF6EE] placeholder:text-[#EDE6D6]/40 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EDE6D6]/40 hover:text-[#FAF6EE]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                selectedCategory === "all"
                  ? "bg-amber-500 text-forest-950 border-amber-400 shadow-md"
                  : "bg-[#142814] text-[#EDE6D6]/70 border-amber-500/20 hover:border-amber-500/40"
              }`}
            >
              <span>All Models</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  selectedCategory === "all" ? "bg-forest-950/20 text-forest-950" : "bg-black/30"
                }`}
              >
                {categoryCounts.all}
              </span>
            </button>

            {MODEL_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    active
                      ? "bg-amber-500 text-forest-950 border-amber-400 shadow-md"
                      : "bg-[#142814] text-[#EDE6D6]/70 border-amber-500/20 hover:border-amber-500/40"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      active ? "bg-forest-950/20 text-forest-950" : "bg-black/30"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-[#EDE6D6]/60 mb-4">
          <span>
            Showing <strong className="text-amber-300 font-semibold">{filteredModels.length}</strong>{" "}
            of {MODEL_REGISTRY.length} models
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-amber-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Grid of 3D Models */}
        {filteredModels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} onInspect={setInspectingModel} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl bg-[#142814]/50 border border-amber-500/15">
            <Box className="w-12 h-12 mx-auto text-amber-500/30 mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[#FAF6EE] mb-1">
              No matching models found
            </h3>
            <p className="text-xs text-[#EDE6D6]/60 max-w-sm mx-auto mb-4">
              Try adjusting your search query or switching categories.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-forest-950"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Inspect Modal */}
      {inspectingModel && (
        <ModelInspectorModal
          model={inspectingModel}
          onClose={() => setInspectingModel(null)}
        />
      )}
    </div>
  );
}
