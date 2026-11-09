"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/shell/PageHeader";
import ErrorStateCard from "@/components/shell/ErrorStateCard";
import CardErrorBoundary from "@/components/CardErrorBoundary";
import AnimatedNumber from "@/components/AnimatedNumber";
import { demoApi, SimulateDayResponse, SimulateDayTick } from "@/lib/api";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Users,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Leaf,
  Layers,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { formatNumber, formatPercent, formatKg } from "@/lib/formatters";

export default function SimulateTodayPage() {
  const [data, setData] = useState<SimulateDayResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation playback state
  const [currentTickIndex, setCurrentTickIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSimulation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await demoApi.getSimulateDay();
      setData(res);
      setCurrentTickIndex(0);
    } catch (err: any) {
      console.error("Failed to load simulation:", err);
      setError(err?.message || "Could not load service timeline simulation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSimulation();
  }, [fetchSimulation]);

  // Handle play/pause timer
  useEffect(() => {
    if (!isPlaying || !data || data.timeline.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(120, 1200 / playbackSpeed);

    timerRef.current = setInterval(() => {
      setCurrentTickIndex((prev) => {
        if (prev >= data.timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, data]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTickIndex(0);
  };

  const handleStep = (direction: "prev" | "next") => {
    if (!data) return;
    setIsPlaying(false);
    if (direction === "next") {
      setCurrentTickIndex((prev) => Math.min(data.timeline.length - 1, prev + 1));
    } else {
      setCurrentTickIndex((prev) => Math.max(0, prev - 1));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-black/5 rounded-2xl w-2/3" />
        <div className="h-28 bg-black/5 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-black/5 rounded-2xl" />
          <div className="h-96 bg-black/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorStateCard
        title="Unable to Load Rush Simulation"
        message={error || "Communication failure with simulation timeline API."}
        onRetry={fetchSimulation}
      />
    );
  }

  const currentTick: SimulateDayTick = (data.timeline && data.timeline[currentTickIndex]) || {
    time: "12:00",
    arrivals: 0,
    cumulative_eaten_kg: 0,
    guesswork_remaining_kg: 0,
    platewise_remaining_kg: 0,
  };
  const isFinished = Boolean(data.timeline && currentTickIndex >= data.timeline.length - 1);

  // Deck Story Percentages
  const gwPrep = data.guesswork_prepared_kg || 100;
  const pwPrep = data.platewise_prepared_kg || 82;
  const eatenKg = currentTick.cumulative_eaten_kg;
  const gwRemaining = currentTick.guesswork_remaining_kg;
  const pwRemaining = currentTick.platewise_remaining_kg;

  // Percent remaining relative to initial prep
  const gwPercentRemaining = gwPrep > 0 ? Math.max(0, (gwRemaining / gwPrep) * 100) : 0;
  const pwPercentRemaining = pwPrep > 0 ? Math.max(0, (pwRemaining / pwPrep) * 100) : 0;

  // Cumulative arrivals up to current tick
  const cumulativeArrivals = (data.timeline || [])
    .slice(0, currentTickIndex + 1)
    .reduce((acc, t) => acc + t.arrivals, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Tabs */}
      <PageHeader
        title="Rush Hour Service Simulation"
        subtitle="12:00 to 14:00 lunch rush split view. Experience the deck's core story: 100 kg cooked vs 75 kg eaten vs 25 kg wasted on guesswork, compared with PlateWise demand-calibrated batching."
        badge="Live Split-View"
        tabs={[
          { label: "Overview", href: "/dashboard", active: false },
          { label: "Today's Plan", href: "/today", active: false },
          { label: "Forecast Lab", href: "/forecast", active: false },
          { label: "Simulate Today", href: "/simulate", active: true },
        ]}
      />

      {/* 2. Interactive Timeline & Playback Controller */}
      <CardErrorBoundary cardTitle="Timeline Playback Controller">
        <div className="p-5 rounded-2xl bg-[#0e2412] text-[#FAF8F2] border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8fa896] font-mono">
                Service Window ({data.service_window})
              </div>
              <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                <span>{currentTick.time} PM</span>
                <span className="text-xs font-normal text-amber-300 font-sans">
                  (+{currentTick.arrivals} diners entering)
                </span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-forest-900/80 hover:bg-forest-800 text-[#8fa896] hover:text-white transition-colors cursor-pointer"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleStep("prev")}
              disabled={currentTickIndex === 0}
              className="p-2 rounded-xl bg-forest-900/80 hover:bg-forest-800 text-[#8fa896] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Tick"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={clsx(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer",
                isPlaying
                  ? "bg-amber-500 text-forest-950 hover:bg-amber-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              )}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isFinished ? "Replay" : "Play Rush"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleStep("next")}
              disabled={isFinished}
              className="p-2 rounded-xl bg-forest-900/80 hover:bg-forest-800 text-[#8fa896] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Tick"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Speed Selector */}
            <div className="flex items-center bg-forest-900/90 rounded-xl p-0.5 border border-amber-500/20 text-xs font-mono ml-2">
              {[1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={clsx(
                    "px-2 py-1 rounded-lg transition-colors cursor-pointer",
                    playbackSpeed === spd
                      ? "bg-amber-500 text-forest-950 font-bold"
                      : "text-[#8fa896] hover:text-white"
                  )}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Scrubber Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="grid grid-cols-13 gap-1">
            {(data.timeline || []).map((tick, idx) => {
              const isPast = idx <= currentTickIndex;
              const isCurrent = idx === currentTickIndex;
              return (
                <button
                  key={tick.time}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTickIndex(idx);
                  }}
                  className={clsx(
                    "h-6 rounded-md text-[10px] font-mono transition-all flex items-center justify-center cursor-pointer",
                    isCurrent
                      ? "bg-amber-400 text-forest-950 font-bold scale-105 shadow-md"
                      : isPast
                      ? "bg-emerald-600/60 text-[#faf8f2]"
                      : "bg-forest-900/60 text-[#8fa896] hover:bg-forest-800"
                  )}
                >
                  {tick.time.slice(3)}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#8fa896]">
            <span>12:00 PM (Doors Open)</span>
            <span>12:50 PM (Peak Footfall)</span>
            <span>14:00 PM (Service Ends)</span>
          </div>
        </div>
      </div>
      </CardErrorBoundary>

      {/* 3. The Deck Split View: "Guesswork" vs "PlateWise" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Traditional Guesswork Side (Terracotta Styling) */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#2d0909]/5 to-white border-2 border-rose-500/30 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                  Deck Baseline
                </span>
                <h3 className="font-serif text-xl font-bold text-[#14211a] mt-1">
                  Traditional Guesswork
                </h3>
                <p className="text-xs text-[#728479]">
                  Cooking for 100% capacity (+5% blind buffer) regardless of external factors.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-700 flex items-center justify-center font-serif text-lg font-bold">
                GW
              </div>
            </div>

            {/* Counters (Prepared / Eaten / Leftover) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-[#e3ded0]">
                <div className="text-[10px] text-[#728479] uppercase">Prepared</div>
                <div className="font-serif text-2xl font-bold text-[#14211a]">
                  {formatNumber(gwPrep, 0)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e3ded0]">
                <div className="text-[10px] text-[#728479] uppercase">Consumed</div>
                <div className="font-serif text-2xl font-bold text-[#14211a]">
                  {formatNumber(eatenKg, 1)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="text-[10px] text-rose-800 font-semibold uppercase">
                  Remaining Food
                </div>
                <div className="font-serif text-2xl font-bold text-[#c8553d]">
                  {formatNumber(gwRemaining, 1)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
            </div>

            {/* Food Tank Depletion Visualizer */}
            <div className="space-y-1.5 p-4 rounded-xl bg-white border border-[#e3ded0]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#14211a]">Kitchen Hot-Holding Tank Level</span>
                <span className="font-mono text-rose-700">
                  {formatKg(gwRemaining, 1)} ({formatPercent(gwPercentRemaining, 0)})
                </span>
              </div>
              <div className="h-6 w-full bg-rose-100 rounded-xl overflow-hidden relative border border-rose-200">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-[#c8553d] transition-all duration-300"
                  style={{ width: `${gwPercentRemaining}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#728479]">
                <span>Full: 100 kg</span>
                <span>Wasted at 14:00: ~25 kg</span>
              </div>
            </div>
          </div>

          {/* Waste Outcome Callout */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-950">
              <span>Closing Service Leftovers:</span>
              <span className="font-mono text-base text-[#c8553d]">
                {isFinished ? `${formatKg(data.guesswork_leftover_kg, 1)} Wasted` : `${formatKg(gwRemaining, 1)} remaining`}
              </span>
            </div>
            <p className="text-[11px] text-rose-900/80 leading-snug">
              {isFinished
                ? "25% of prepared meals end directly in the garbage bin. Upstream water, transport, and cooking gas fully lost."
                : "Steam trays over-stocked with blind portions. Expect ~25 kg left untouched at closing."}
            </p>
          </div>
        </div>

        {/* RIGHT: PlateWise AI Forecast Side (Emerald / Harvest Green) */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-500/5 to-white border-2 border-emerald-500/40 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PlateWise AI Engine
                </span>
                <h3 className="font-serif text-xl font-bold text-[#14211a] mt-1">
                  Demand-Calibrated Cooking
                </h3>
                <p className="text-xs text-[#728479]">
                  Cooking for 75 kg anticipated demand with 7 kg safety buffer against runouts.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center font-serif text-lg font-bold">
                PW
              </div>
            </div>

            {/* Counters (Prepared / Eaten / Leftover) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white border border-[#e3ded0]">
                <div className="text-[10px] text-[#728479] uppercase">Prepared</div>
                <div className="font-serif text-2xl font-bold text-[#14211a]">
                  {formatNumber(pwPrep, 0)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e3ded0]">
                <div className="text-[10px] text-[#728479] uppercase">Consumed</div>
                <div className="font-serif text-2xl font-bold text-[#14211a]">
                  {formatNumber(eatenKg, 1)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-[10px] text-emerald-800 font-semibold uppercase">
                  Remaining Food
                </div>
                <div className="font-serif text-2xl font-bold text-[#3e9b66]">
                  {formatNumber(pwRemaining, 1)} <span className="text-xs font-normal">kg</span>
                </div>
              </div>
            </div>

            {/* Food Tank Depletion Visualizer */}
            <div className="space-y-1.5 p-4 rounded-xl bg-white border border-[#e3ded0]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#14211a]">Kitchen Hot-Holding Tank Level</span>
                <span className="font-mono text-emerald-700">
                  {formatKg(pwRemaining, 1)} ({formatPercent(pwPercentRemaining, 0)})
                </span>
              </div>
              <div className="h-6 w-full bg-emerald-50 rounded-xl overflow-hidden relative border border-emerald-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#3e9b66] transition-all duration-300"
                  style={{ width: `${pwPercentRemaining}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#728479]">
                <span>Targeted: 82 kg</span>
                <span>Safe Buffer at 14:00: ~7 kg</span>
              </div>
            </div>
          </div>

          {/* Savings Outcome Callout */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span>Closing Service Result:</span>
              <span className="font-mono text-base text-[#3e9b66]">
                {isFinished
                  ? `-${formatKg((data.guesswork_leftover_kg ?? 0) - (data.platewise_leftover_kg ?? 0), 1)} Waste Cut`
                  : "0 Stockouts • Safe 7 kg Buffer"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/80 leading-snug">
              {isFinished
                ? "100% of diner demand satisfied with zero shortages, while cutting 18 kg of food waste in a single lunch shift."
                : "Dynamic batch synchronization prevents over-prep while protecting student satisfaction."}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Final Savings Summary Strip */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0e2412] to-[#1a3a1a] text-[#FAF8F2] border border-amber-500/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-[#FAF8F2]">
              Net Single-Service Savings Summary
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {cumulativeArrivals} Diners Fed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] text-[#8fa896] uppercase font-mono">
              Food Saved
            </div>
            <div className="font-serif text-2xl font-bold text-[#3e9b66]">
              <AnimatedNumber
                value={data.guesswork_leftover_kg - data.platewise_leftover_kg}
                decimals={1}
                suffix=" kg"
              />
            </div>
            <div className="text-[10px] text-[#8fa896]">-72% waste reduction</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] text-[#8fa896] uppercase font-mono">
              Budget Saved
            </div>
            <div className="font-serif text-2xl font-bold text-amber-400">
              <AnimatedNumber
                value={(data.guesswork_leftover_kg - data.platewise_leftover_kg) * 40}
                decimals={0}
                prefix="₹"
              />
            </div>
            <div className="text-[10px] text-[#8fa896]">₹40/kg bulk procurement</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] text-[#8fa896] uppercase font-mono">
              Avoided Carbon
            </div>
            <div className="font-serif text-2xl font-bold text-teal-300">
              <AnimatedNumber
                value={(data.guesswork_leftover_kg - data.platewise_leftover_kg) * 2.5}
                decimals={1}
                suffix=" kg"
              />
            </div>
            <div className="text-[10px] text-[#8fa896]">Avoided landfill methane</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
            <div className="text-[10px] text-[#8fa896] uppercase font-mono">
              Service Stockouts
            </div>
            <div className="font-serif text-2xl font-bold text-emerald-400">
              0 Shortages
            </div>
            <div className="text-[10px] text-[#8fa896]">100% student satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
}
