"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { Sparkles, Play, Download, Sliders } from "lucide-react";

export default function ForecastLabPage() {
  return (
    <div>
      <PageHeader
        title="Demand Forecast Lab"
        subtitle="Bayesian predictive model incorporating local weather shifts, academic timetables, and historical attendance patterns."
        badge="Bayesian Lab"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export Model Predictions</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Scenario Simulation</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={Sparkles}
        title="Bayesian Scenario Simulator Ready For Analysis"
        description="PlateWise continuously correlates university calendar cycles, weather sensors, and meal history. Use this lab to stress-test your kitchen against sudden attendance surges or drops."
        highlightText="Simulate rain impact (+28% hot snack and paratha demand) or mid-term exam week footfall shifts."
        metrics={[
          { label: "Base Forecast", value: "1,180 Diners" },
          { label: "Rain Multiplier", value: "+12% Comfort Foods" },
          { label: "Model Confidence", value: "94.8% R²" },
        ]}
        actions={[
          { label: "Test Rain Weather Event (+15%)", primary: true },
          { label: "Simulate Exam Week Schedule" },
          { label: "Calibrate Sensitivity Weights" },
        ]}
      />
    </div>
  );
}
