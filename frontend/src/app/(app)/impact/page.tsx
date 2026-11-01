"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { Leaf, FileDown, Settings2, Award } from "lucide-react";

export default function ImpactPage() {
  return (
    <div>
      <PageHeader
        title="Environmental & Cost Impact"
        subtitle="Verified sustainability metrics, landfill diversion ledger, and university raw budget savings."
        badge="Zero Waste"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Adjust Mess Baseline</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Board Audit (PDF)</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={Leaf}
        title="Institutional Decarbonization Ledger Updated"
        description="PlateWise logs every kilogram of un-wasted kitchen inventory directly into your university's environmental ledger, converting organic diversion into certified CO₂e credits and raw financial savings."
        highlightText="Campus Milestone: 8.4 Metric Tons of edible food diverted from local landfills over the past academic semester."
        metrics={[
          { label: "Waste Avoided", value: "8,400 kg (-32%)" },
          { label: "Financial Dividend", value: "₹14.2 Lakh" },
          { label: "CO₂e Prevented", value: "21.0 MT" },
        ]}
        actions={[
          { label: "Generate Board Sustainability Dossier", primary: true },
          { label: "Review IPCC / FAO Emission Methodology" },
          { label: "Campus Waste Dashboard Public Link" },
        ]}
      />
    </div>
  );
}
