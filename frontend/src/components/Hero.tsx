"use client";

import React from "react";
import { motion } from "framer-motion";
import BakeryCanvasWrapper from "./3d/BakeryCanvasWrapper";

export default function Hero() {
  const scrollToStory = () => {
    const el = document.getElementById("waste-story");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-[#162e16]">
      {/* Background ambient gradient and organic glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(217,119,6,0.18),rgba(26,58,26,0.95),#0f230f)] pointer-events-none" />

      {/* Subtle institutional grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fbf8f1 1px, transparent 1px), linear-gradient(to right, #fbf8f1 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Headline, Narrative & Conversion CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="lg:col-span-6 flex flex-col items-start text-left"
        >
          {/* Deck Aesthetic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/80 border border-amber-500/30 text-amber-300 text-xs font-medium tracking-wide shadow-lg mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Campus Dining & Bakery Intelligence</span>
          </div>

          {/* Serif Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-[#FAF6EE] leading-[1.12] tracking-tight mb-6">
            Predict demand. <br />
            <span className="italic font-serif text-amber-400">Cook to fit.</span> <br />
            End cafeteria waste.
          </h1>

          {/* Subhead narrative */}
          <p className="text-base sm:text-lg text-[#EDE6D6]/85 font-light leading-relaxed max-w-xl mb-8">
            Every university cafeteria over-prepares to prevent stockouts. PlateWise AI
            leverages timetable analytics, weather forecasts, and historical meal data
            to guide daily kitchen batches down to the single serving.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
            <a
              href="#impact"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 font-semibold text-sm tracking-wide shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5 text-center"
            >
              Request Campus Pilot
            </a>

            <button
              onClick={scrollToStory}
              className="px-6 py-3.5 rounded-full bg-forest-900/80 hover:bg-forest-800/80 text-[#FAF6EE] border border-amber-500/25 hover:border-amber-400/40 text-sm font-medium tracking-wide transition-all text-center flex items-center justify-center gap-2"
            >
              <span>See The Waste Math</span>
              <svg
                className="w-4 h-4 text-amber-400 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

          {/* Institutional Stats strip */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-cream-200/10 w-full max-w-lg">
            <div>
              <div className="font-serif text-2xl font-semibold text-amber-400">32%</div>
              <div className="text-xs text-[#EDE6D6]/70 mt-0.5">Average waste reduction</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-semibold text-[#FAF6EE]">₹45/kg</div>
              <div className="text-xs text-[#EDE6D6]/70 mt-0.5">Direct raw savings</div>
            </div>
            <div>
              <div className="font-serif text-2xl font-semibold text-emerald-400">2.5 kg</div>
              <div className="text-xs text-[#EDE6D6]/70 mt-0.5">CO₂e diverted / kg</div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Real-time 3D Stylized Bakery Kitchen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
          className="lg:col-span-6 w-full"
        >
          <div className="relative">
            {/* Ambient backdrop glow behind 3D container */}
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-emerald-600/10 rounded-3xl blur-2xl opacity-50 pointer-events-none" />

            {/* 3D Canvas wrapper */}
            <BakeryCanvasWrapper />

            {/* Floating micro-badge overlay */}
            <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto bg-[#142914]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-500/30 text-xs text-[#FAF6EE] flex items-center gap-3 shadow-xl pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                <strong className="text-amber-300 font-medium">Bake-To-Order Loop:</strong> Bread rises & golden brown crust sets as batch demand optimizes.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
