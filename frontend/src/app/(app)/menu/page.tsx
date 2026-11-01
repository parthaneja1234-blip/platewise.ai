"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { BookOpen, Plus, ShoppingCart, Calendar } from "lucide-react";

export default function MenuPlannerPage() {
  return (
    <div>
      <PageHeader
        title="Institutional Menu Planner"
        subtitle="Weekly cyclical meal rotation with ingredient decay tracking and bulk procurement optimization."
        badge="Menu Rotation"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
              <span>Generate Procurement Order</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Recipe</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={BookOpen}
        title="Week 45 Institutional Menu Cycle Active"
        description="All 18 institutional mess recipes are mapped with standard per-student scaling grammage (e.g. 110 g rice, 90 g dal, 75 g paneer). PlateWise automatically alerts mess managers when ingredients approach freshness expiration."
        highlightText="Current Roster: Rotation B (North & South Indian Hybrid Menu). Next rotation switch in 5 days."
        metrics={[
          { label: "Active Recipes", value: "18 Dishes" },
          { label: "Cycle Phase", value: "Week 45 (Rot B)" },
          { label: "Ingredient Decay", value: "0 Spoilage Risk" },
        ]}
        actions={[
          { label: "Edit Weekly Menu Calendar", primary: true },
          { label: "Review Recipe Scaling Coefficients" },
          { label: "Download Procurement Manifest" },
        ]}
      />
    </div>
  );
}
