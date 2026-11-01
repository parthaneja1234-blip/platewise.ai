"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { ChefHat, Printer, CheckCircle2, Clock } from "lucide-react";

export default function TodayPlanPage() {
  return (
    <div>
      <PageHeader
        title="Today's Batch Cook Plan"
        subtitle="Staged kitchen production schedule: Cook 55% at 11:30 AM, top-up at 1:15 PM based on real-time lunch attendance."
        badge="Batch Schedule"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Print Station Token Sheet</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge Morning Prep</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={ChefHat}
        title="Lunch Staged Batch Schedule Ready For Head Cook"
        description="Rather than cooking 100% of lunch dishes at 10:30 AM, PlateWise divides preparation into two synchronized cooking batches based on arrival velocity."
        highlightText="Stage 1 Batch starts cooking at 11:15 AM (650 portions). Stage 2 fires at 1:10 PM only for remaining demand."
        metrics={[
          { label: "Stage 1 (Primary)", value: "650 servings" },
          { label: "Stage 2 (Dynamic)", value: "530 servings" },
          { label: "Safety Margin", value: "3.2% Buffer" },
        ]}
        actions={[
          { label: "Mark Stage 1 Ingredients Pulled", primary: true },
          { label: "Fine-tune Recipe Servings" },
          { label: "View Historical Batch Accuracy" },
        ]}
      />
    </div>
  );
}
