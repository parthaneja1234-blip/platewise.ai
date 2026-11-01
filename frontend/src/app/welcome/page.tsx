"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StorySection from "@/components/StorySection";
import ImpactSection from "@/components/ImpactSection";
import CreditsSection from "@/components/CreditsSection";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1a3a1a] text-[#FAF6EE] selection:bg-amber-500 selection:text-forest-950">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero with Real-Time 3D Procedural Bakery Kitchen */}
        <Hero />

        {/* 2. Scroll-Driven Story: 100 kg -> 75 kg -> 25 kg & Shrinking Plate Pile */}
        <StorySection />

        {/* 3. Impact Section: 3 Animated Cards (Less Waste, Lower Costs, Fewer Emissions) */}
        <ImpactSection />

        {/* 4. 3D Asset Attribution & Credits Section (reads /models/CREDITS.md) */}
        <CreditsSection />

        {/* 5. Launch App / Pilot Banner */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#183418] to-[#102410] border-t border-amber-500/15 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-950/70 border border-amber-500/30 mb-6">
              Institutional Cafeteria Platform
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FAF6EE] mb-6 leading-tight">
              Ready to explore live mess operations <br />
              <span className="italic font-serif text-amber-400">inside the app?</span>
            </h2>
            <p className="text-base sm:text-lg text-[#EDE6D6]/80 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience the full PlateWise application shell: batch planning, Bayesian demand forecasting,
              and live leftover logging across campus dining halls.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 font-semibold text-sm tracking-wide shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Launch App Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <a
                href="mailto:pilot@platewise.ai"
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-forest-900/80 hover:bg-forest-800 text-[#FAF6EE] border border-amber-500/25 text-sm font-medium transition-all text-center"
              >
                Schedule Campus Pilot
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Footer */}
      <Footer />
    </div>
  );
}
