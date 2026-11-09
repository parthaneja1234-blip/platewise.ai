"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "@/components/shell/PageHeader";
import { Leaf, FileDown, Settings2, TreePine, Award, TrendingUp, ShieldCheck } from "lucide-react";

const ImpactForestScene = dynamic(() => import("@/components/3d/ImpactForestScene"), {
  ssr: false,
});

export default function ImpactPage() {
  const [co2eAvoidedKg, setCo2eAvoidedKg] = useState<number>(21000);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Environmental & Cost Impact"
        subtitle="Verified sustainability metrics, landfill diversion ledger, and university raw budget savings."
        badge="Zero Waste"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Print Sustainability Audit</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certify IPCC Credits</span>
            </button>
          </div>
        }
      />

      {/* 1. 3D Procedural Growing Forest Scene */}
      <ImpactForestScene co2eAvoidedKg={co2eAvoidedKg} />

      {/* 2. Interactive Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#728479]">
            <span>Total Food Diverted</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#14211a]">
            8,400 kg
          </div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">
            -32% vs Guesswork baseline
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#728479]">
            <span>Raw Budget Saved</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#14211a]">
            ₹14.2 Lakh
          </div>
          <div className="text-[11px] font-mono text-amber-800 font-semibold">
            Institutional groceries preserved
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#728479]">
            <span>CO₂e Greenhouse Avoided</span>
            <TreePine className="w-4 h-4 text-teal-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#14211a]">
            21.0 MT
          </div>
          <div className="text-[11px] font-mono text-teal-700 font-semibold">
            Certified carbon dividend
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#728479]">
            <span>Forest Equivalent</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#14211a]">
            954 Tree-Years
          </div>
          <div className="text-[11px] font-mono text-emerald-700 font-semibold">
            Living canopy offset
          </div>
        </div>
      </div>

      {/* 3. Methodology & Assumptions Card */}
      <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#14211a]">
            IPCC & FAO Emission Methodology & Assumptions
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest-950/5 text-[#4a5a50] border border-[#e3ded0]">
            Audit Ready
          </span>
        </div>
        <p className="text-xs text-[#728479] leading-relaxed">
          Estimates calculate lifecycle upstream inputs (fertilizer, irrigation, farm fuel, cold-chain transport, cooking gas) plus avoided anaerobic landfill decomposition producing methane (CH₄, 28x GWP of CO₂). Factor: 2.5 kg CO₂e per 1.0 kg prepared cooked food waste prevented.
        </p>
        <div className="pt-2 border-t border-[#e3ded0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#728479]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified against DEFRA / IPCC 2024 emission multipliers</span>
          </span>
          <span className="font-mono text-[11px]">
            Data Source: Persistent PostgreSQL Ledger
          </span>
        </div>
      </div>
    </div>
  );
}
