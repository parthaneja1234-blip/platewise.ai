"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StorySection() {
  const [isOptimized, setIsOptimized] = useState<boolean>(false);

  // Status Quo vs PlateWise figures
  const preparedKg = isOptimized ? 78 : 100;
  const consumedKg = 75;
  const wastedKg = isOptimized ? 3 : 25;
  const wasteCost = isOptimized ? "₹135" : "₹1,125";
  const plateCount = isOptimized ? 2 : 10;

  return (
    <section
      id="waste-story"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-[#183418] text-[#FAF6EE] overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900/90 border border-amber-500/25 text-amber-300 text-xs font-medium tracking-wider uppercase mb-4">
            The Cafeteria Paradox
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-[#FAF6EE] mb-6">
            100 kg prepared. 75 kg consumed. <br />
            <span className="italic font-serif text-amber-400">
              25 kg straight into the dumpster.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#EDE6D6]/80 font-light leading-relaxed">
            Every mess manager fears running out of food when 800 hungry students arrive.
            Without demand forecasting, kitchens routinely over-cook by 25% every single day.
          </p>
        </div>

        {/* Interactive Math & Plate Pile Demonstration */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#132813]/90 rounded-3xl p-6 sm:p-10 border border-amber-500/20 shadow-2xl mb-24">
          {/* Left Column: Number Counters & State Switcher */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Toggle Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-4 p-2 rounded-2xl bg-[#0f210f] border border-amber-500/20 mb-8">
              <button
                type="button"
                onClick={() => setIsOptimized(false)}
                className={`flex-1 py-3 px-5 rounded-xl text-sm font-medium transition-all ${
                  !isOptimized
                    ? "bg-[#1f421f] text-[#FAF6EE] shadow-md border border-amber-500/30 font-semibold"
                    : "text-[#EDE6D6]/60 hover:text-[#FAF6EE]"
                }`}
              >
                1. Status Quo (Blind Prep)
              </button>
              <button
                type="button"
                onClick={() => setIsOptimized(true)}
                className={`flex-1 py-3 px-5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isOptimized
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-forest-950 shadow-lg font-semibold"
                    : "text-[#EDE6D6]/60 hover:text-amber-300"
                }`}
              >
                <span>2. With PlateWise AI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-forest-950 text-amber-300">
                  -88% Waste
                </span>
              </button>
            </div>

            {/* 3 Metrics: Prepared -> Consumed -> Wasted */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Prepared */}
              <div className="p-5 rounded-2xl bg-[#162d16] border border-cream-200/10">
                <div className="text-xs text-[#EDE6D6]/70 uppercase tracking-wider mb-1 font-medium">
                  Prepared
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-semibold text-[#FAF6EE]">
                  <motion.span
                    key={`prep-${preparedKg}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {preparedKg}
                  </motion.span>
                  <span className="text-lg font-normal text-amber-400 ml-1">kg</span>
                </div>
                <div className="text-xs text-cream-200/60 mt-2">
                  {isOptimized ? "Dynamic safe buffer" : "Fixed blind batch"}
                </div>
              </div>

              {/* Consumed */}
              <div className="p-5 rounded-2xl bg-[#162d16] border border-cream-200/10">
                <div className="text-xs text-[#EDE6D6]/70 uppercase tracking-wider mb-1 font-medium">
                  Consumed
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-semibold text-emerald-400">
                  {consumedKg}
                  <span className="text-lg font-normal text-emerald-400/80 ml-1">kg</span>
                </div>
                <div className="text-xs text-emerald-300/70 mt-2">
                  100% Student satisfaction
                </div>
              </div>

              {/* Wasted */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isOptimized
                    ? "bg-emerald-950/40 border-emerald-500/30"
                    : "bg-red-950/40 border-red-500/30"
                }`}
              >
                <div className="text-xs uppercase tracking-wider mb-1 font-medium flex items-center justify-between">
                  <span className={isOptimized ? "text-emerald-300" : "text-red-300"}>
                    Discarded
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
                    {wasteCost}/lunch
                  </span>
                </div>
                <div
                  className={`font-serif text-3xl sm:text-4xl font-semibold ${
                    isOptimized ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <motion.span
                    key={`waste-${wastedKg}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    {wastedKg}
                  </motion.span>
                  <span className="text-lg font-normal ml-1">kg</span>
                </div>
                <div className="text-xs text-cream-200/60 mt-2">
                  {isOptimized ? "Near-zero prep surplus" : "250 portions thrown out"}
                </div>
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs sm:text-sm text-[#EDE6D6]/85 leading-relaxed">
              <strong className="text-amber-300 font-medium">
                {isOptimized ? "PlateWise Demand Optimization:" : "The Blind Prep Trap:"}
              </strong>{" "}
              {isOptimized
                ? "Kitchen prepares 78 kg in split batches. All student demand is met with hot food, and leftover food is reduced by 88%."
                : "Mess cooks prepare 100 kg at once. After lunch, 25 kg of rice, dal, and paneer is dumped into the compost heap."}
            </div>
          </div>

          {/* Right Column: Visual Animated Plate Pile */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#0e210e] rounded-2xl border border-cream-200/10 min-h-[360px]">
            <div className="text-xs uppercase tracking-wider text-amber-300/80 mb-6 font-medium text-center">
              {isOptimized ? "Optimized Remaining Waste Buffer" : "Surplus Plate Waste Stack"}
            </div>

            {/* Plate Stack Container */}
            <div className="relative w-48 h-56 flex flex-col-reverse items-center justify-start pb-4">
              <AnimatePresence>
                {Array.from({ length: plateCount }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.8 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="relative w-36 h-6 -mt-3.5 rounded-full border shadow-md flex items-center justify-center"
                    style={{
                      backgroundColor: isOptimized ? "#2d6a4f" : idx > 4 ? "#991b1b" : "#b45309",
                      borderColor: isOptimized ? "#52b788" : idx > 4 ? "#f87171" : "#f59e0b",
                    }}
                  >
                    <div className="w-28 h-3 rounded-full bg-black/20" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Pedestal plate tray */}
              <div className="w-44 h-4 rounded-xl bg-forest-950 border border-amber-500/30 mt-2 shadow-inner" />
            </div>

            {/* Plate Count Badge */}
            <div className="mt-4 text-center">
              <span
                className={`text-sm font-semibold font-serif ${
                  isOptimized ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {isOptimized ? "3 kg Leftover Buffer (1-2 plates)" : "25 kg Surplus (10 Plate Stacks)"}
              </span>
              <p className="text-xs text-[#EDE6D6]/60 mt-1">
                {isOptimized ? "Safe for campus zero-waste certification" : "Direct university food cost loss"}
              </p>
            </div>
          </div>
        </div>

        {/* The "Predict Demand, Cook To Fit" 3-Step Flow */}
        <div className="pt-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase">
              The Architecture
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF6EE] mt-2">
              Predict demand. Cook to fit.
            </h3>
            <p className="text-sm text-[#EDE6D6]/75 mt-3">
              How PlateWise replaces kitchen guesswork with continuous learning.
            </p>
          </div>

          {/* 3 Animated Workflow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Inputs */}
            <motion.div
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/20 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 font-serif font-bold text-lg">
                  01
                </div>
                <h4 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-3">
                  Multi-Modal Inputs
                </h4>
                <p className="text-sm text-[#EDE6D6]/80 leading-relaxed mb-6 font-light">
                  Captures real university rhythm before the stoves turn on:
                </p>
                <ul className="space-y-2.5 text-xs text-[#EDE6D6]/90">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Academic calendar & exam week schedules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Live hostel occupancy & campus gates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Local weather (rain spikes paratha by 28%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Past meal attendance trends</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-cream-200/10 text-[11px] text-amber-300 font-mono">
                → Real-Time Signal Ingestion
              </div>
            </motion.div>

            {/* Step 2: Prediction Engine */}
            <motion.div
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-6 font-serif font-bold text-lg">
                  02
                </div>
                <h4 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-3">
                  PlateWise Engine
                </h4>
                <p className="text-sm text-[#EDE6D6]/80 leading-relaxed mb-6 font-light">
                  Specialized Bayesian temporal model calibrated for dining halls:
                </p>
                <ul className="space-y-2.5 text-xs text-[#EDE6D6]/90">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Confidence interval buffer calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Perishable ingredient decay tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Dish recipe scaling matrix</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Batch production split recommendations</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-cream-200/10 text-[11px] text-amber-300 font-mono">
                → Hourly Forecast Synthesis
              </div>
            </motion.div>

            {/* Step 3: Recommended Servings */}
            <motion.div
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/20 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 font-serif font-bold text-lg">
                  03
                </div>
                <h4 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-3">
                  Cook-To-Fit Prep Sheets
                </h4>
                <p className="text-sm text-[#EDE6D6]/80 leading-relaxed mb-6 font-light">
                  Simple, visual instructions sent directly to chef prep stations:
                </p>
                <ul className="space-y-2.5 text-xs text-[#EDE6D6]/90">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Exact raw material pull weights (kg)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Batch 1: 55% at 11:30 AM</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Batch 2: Dynamic top-up at 1:15 PM</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Zero stockout alerts for front counters</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-4 border-t border-cream-200/10 text-[11px] text-emerald-400 font-mono">
                → Kitchen Execution Ready
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
