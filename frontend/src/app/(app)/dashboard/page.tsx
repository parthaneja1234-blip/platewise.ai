"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { LayoutDashboard, Users, Scale, TrendingDown, DollarSign, Plus, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Mess Operations Overview"
        subtitle="Live cafeteria performance, demand variance tracking, and today's kitchen readiness."
        badge="Live Operations"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/today"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-sm transition-all focus-ring"
            >
              Today's Cook Sheet
            </Link>
            <Link
              href="/forecast"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simulate Forecast</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white border border-[#e8dfcf] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#7d9185] font-medium mb-2">
            <span>Forecasted Diners</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#1b2e24] mb-1">
            1,180
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span>98.2% Confidence</span>
            <span className="text-[#7d9185] font-normal">• ±25 buffer</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e8dfcf] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#7d9185] font-medium mb-2">
            <span>Planned Prep Weight</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#1b2e24] mb-1">
            265 <span className="text-base font-normal text-[#7d9185]">kg</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            <span>-75 kg</span> vs historical unoptimized blind prep
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e8dfcf] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#7d9185] font-medium mb-2">
            <span>Waste Reduction Rate</span>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-emerald-700 mb-1">
            34.2%
          </div>
          <div className="text-[11px] text-[#7d9185]">
            Target: &gt; 30% monthly reduction
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#e8dfcf] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#7d9185] font-medium mb-2">
            <span>Estimated Day Savings</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-amber-600 mb-1">
            ₹3,375
          </div>
          <div className="text-[11px] text-[#7d9185]">
            Raw food inventory cost saved today
          </div>
        </div>
      </div>

      {/* Main Empty State & Readiness Card */}
      <EmptyStateCard
        icon={LayoutDashboard}
        title="Kitchen Production Stations Operating In Green"
        description="All four active kitchen lines (Rice, Dal, Subji, Roti) are synchronized with the morning timetable. Zero stockouts or ingredient shortages reported for the upcoming lunch rush."
        highlightText="Next Action: 1:00 PM Stage 2 batch top-up trigger will activate when student hostel gate footfall exceeds 600 taps."
        metrics={[
          { label: "Active Stations", value: "4 / 4" },
          { label: "Attendance Pace", value: "Normal (Mon)" },
          { label: "Weather Factor", value: "Sunny (28°C)" },
        ]}
        actions={[
          { label: "View Today's Cook Schedule", href: "/today", primary: true },
          { label: "Log Meal Actuals", href: "/log" },
          { label: "Forecast Lab Scenarios", href: "/forecast" },
        ]}
      />
    </div>
  );
}
