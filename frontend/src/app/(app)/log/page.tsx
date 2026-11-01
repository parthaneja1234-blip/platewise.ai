"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { ClipboardList, Plus, FileSpreadsheet, History } from "lucide-react";

export default function LogMealsPage() {
  return (
    <div>
      <PageHeader
        title="Log Daily Meal Data"
        subtitle="Record opening preparation pull weight, closing leftovers, and student attendance counts."
        badge="Audit Ledger"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              <span>Import Weigh-Scale CSV</span>
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Meal Batch</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={ClipboardList}
        title="No Leftover Entries Recorded Yet For Lunch"
        description="Daily meal logging feeds PlateWise's closed-loop calibration. Record prep weights before cooking and leftover pan weights at the end of each meal shift."
        highlightText="Breakfast was logged successfully: 98 kg cooked, 94 kg consumed, 4 kg scrapings (3.9% waste)."
        metrics={[
          { label: "Today's Status", value: "Breakfast Complete" },
          { label: "Active Shift", value: "Lunch (In Progress)" },
          { label: "Weekly Compliance", value: "100% Logged" },
        ]}
        actions={[
          { label: "Record Lunch Leftovers (Scale Entry)", primary: true },
          { label: "View Weekly Waste Ledger" },
          { label: "Configure Kitchen Weighing Scales" },
        ]}
      />
    </div>
  );
}
