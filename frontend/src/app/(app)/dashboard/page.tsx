"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/shell/PageHeader";
import ErrorStateCard from "@/components/shell/ErrorStateCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import Sparkline from "@/components/Sparkline";
import FoodIcon from "@/components/FoodIcon";
import { useToast } from "@/components/Toast";
import { demoApi, OverviewResponse, PlanResponse } from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Scale,
  DollarSign,
  Leaf,
  Target,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Utensils,
  Layers,
  ChefHat,
  Box,
} from "lucide-react";
import dynamic from "next/dynamic";

const DashboardKitchenScene = dynamic(
  () => import("@/components/3d/DashboardKitchenScene"),
  { ssr: false }
);
import clsx from "clsx";
import { useAppContext } from "@/context/AppContext";
import CardErrorBoundary from "@/components/CardErrorBoundary";
import { formatINR, formatNumber, formatPercent, formatKg } from "@/lib/formatters";

// Recharts custom tooltip
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl bg-[#0e2412] text-[#faf8f2] border border-amber-500/30 p-3 shadow-xl text-xs space-y-1.5 font-sans">
        <div className="font-mono text-[11px] text-amber-300 font-semibold border-b border-amber-500/20 pb-1 flex items-center justify-between gap-4">
          <span>{label}</span>
          {data.is_exam && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
              Exam
            </span>
          )}
          {data.is_rainy && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
              Rain
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 text-[#c8553d]">
          <span>Blind Guesswork:</span>
          <span className="font-mono font-bold">{data.guesswork_waste_kg} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[#3e9b66]">
          <span>PlateWise Forecast:</span>
          <span className="font-mono font-bold">{data.platewise_waste_kg} kg</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-amber-400 pt-1 border-t border-amber-500/20 font-semibold">
          <span>Waste Cut:</span>
          <span className="font-mono">-{data.waste_prevented_kg} kg</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const { activeMessId, activeMess } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [nextPlan, setNextPlan] = useState<PlanResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Approval state
  const [isApproving, setIsApproving] = useState(false);
  const [approvedLocally, setApprovedLocally] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovData, planData] = await Promise.all([
        demoApi.getOverview(activeMessId),
        demoApi.getPlan({ mess_id: activeMessId, meal: "Lunch" }),
      ]);
      setOverview(ovData);
      setNextPlan(planData);
      setApprovedLocally(planData.is_approved);
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
      setError(err?.message || "Failed to connect to cafeteria prediction engine.");
    } finally {
      setLoading(false);
    }
  }, [activeMessId]);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [fetchData]);


  const handleApprovePlan = async () => {
    if (!nextPlan) return;
    try {
      setIsApproving(true);
      await demoApi.approvePlan({
        mess_id: nextPlan.mess_id,
        date: nextPlan.date,
        meal: nextPlan.meal,
      });
      setApprovedLocally(true);
      toast({
        type: "success",
        title: "Kitchen Cook Sheet Approved",
        description: `Production authorization sent to Head Chef for ${nextPlan.meal} (${nextPlan.total_recommended_kg} kg planned).`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Approval Failed",
        description: err?.message || "Could not authorize production batch.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-black/5 rounded-2xl w-2/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-black/5 rounded-2xl p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-black/5 rounded-2xl" />
          <div className="h-96 bg-black/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error || !overview || !nextPlan) {
    return (
      <ErrorStateCard
        title="Unable to Load Operations Telemetry"
        message={error || "Unknown communication failure with the local AI forecasting service."}
        onRetry={fetchData}
      />
    );
  }

  const kpis = overview.kpis;
  const spark = kpis.sparklines || {
    kg_saved: [90, 105, 112, 98, 120, 115, 130],
    inr_saved: [3600, 4200, 4480, 3920, 4800, 4600, 5200],
    co2e_avoided: [225, 262, 280, 245, 300, 287, 325],
    accuracy: [91.2, 92.0, 91.8, 92.5, 92.1, 92.8, 92.4],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Tab Bar */}
      <PageHeader
        title="Mess Operations Overview"
        subtitle="Live college dining hall intelligence, predictive demand sizing, and climate-aligned food waste mitigation."
        badge="Live Operations"
        tabs={[
          { label: "Overview", href: "/dashboard", active: true },
          { label: "Today's Plan", href: "/today", active: false },
          { label: "Plate Studio", href: "/plate-studio", active: false },
          { label: "Log Meals", href: "/log", active: false },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/today"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e3ded0] hover:border-amber-500/40 text-[#14211a] shadow-xs transition-all focus-ring"
            >
              Today&apos;s Cook Sheet
            </Link>
            <Link
              href="/forecast"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-xs transition-all focus-ring flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Forecast</span>
            </Link>
          </div>
        }
      />

      {/* 1b. Truth in Labelling & Verification Notice Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-[#e3ded0] shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#728479] font-medium">Dataset Origin:</span>
          <span
            className={clsx(
              "px-2.5 py-0.5 rounded-full font-mono font-semibold text-[11px] border",
              overview.data_source === "college_imported"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-amber-50 text-amber-800 border-amber-300"
            )}
          >
            {overview.data_label ||
              (overview.data_source === "college_imported"
                ? "College data (imported)"
                : "Demo data (synthetic)")}
          </span>
        </div>

        {overview.unverified_items_count !== undefined && overview.unverified_items_count > 0 && (
          <Link
            href="/foods"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/25 font-medium hover:bg-amber-500/20 transition-colors text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Includes {overview.unverified_items_count} unverified items (review catalog)</span>
            <ChevronRight className="w-3 h-3 text-amber-600 ml-0.5" />
          </Link>
        )}
      </div>

      {/* 2. Primary KPI Strip with Count-Up and Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Kg Saved */}
        <CardErrorBoundary cardTitle="Food Waste Prevented" compact>
          <div className="p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs hover:border-[#3e9b66]/50 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-[#728479] font-medium mb-1.5">
                <span>Food Waste Prevented</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-[#3e9b66] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-3xl font-bold text-[#14211a] tracking-tight">
                <AnimatedNumber
                  value={kpis?.kg_waste_prevented}
                  decimals={1}
                  suffix=" kg"
                />
              </div>
              <div className="text-[11px] text-[#3e9b66] font-semibold flex items-center gap-1 mt-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{formatPercent(kpis?.reduction_factor_pct, 1)} reduction</span>
                <span className="text-[#728479] font-normal">• vs capacity</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e3ded0]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#728479] font-mono">7-day trend</span>
              <Sparkline
                data={spark.kg_saved}
                color="#3e9b66"
                fillColor="#3e9b66"
                height={26}
                width={75}
              />
            </div>
          </div>
        </CardErrorBoundary>

        {/* KPI 2: INR Saved */}
        <CardErrorBoundary cardTitle="Procurement Budget Saved" compact>
          <div className="p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs hover:border-[#e8a33d]/50 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-[#728479] font-medium mb-1.5">
                <span>Procurement Budget Saved</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#e8a33d] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-3xl font-bold text-[#14211a] tracking-tight">
                <AnimatedNumber
                  value={kpis?.inr_saved}
                  decimals={0}
                  prefix="₹"
                />
              </div>
              <div className="text-[11px] text-[#c9831f] font-semibold flex items-center gap-1 mt-1">
                <span>₹40/kg bulk baseline</span>
                <span className="text-[#728479] font-normal">• audited raw cost</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e3ded0]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#728479] font-mono">7-day trend</span>
              <Sparkline
                data={spark.inr_saved}
                color="#e8a33d"
                fillColor="#e8a33d"
                height={26}
                width={75}
              />
            </div>
          </div>
        </CardErrorBoundary>

        {/* KPI 3: CO2e Avoided */}
        <CardErrorBoundary cardTitle="Carbon Emissions Avoided" compact>
          <div className="p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs hover:border-[#2f8f9d]/50 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-[#728479] font-medium mb-1.5">
                <span>Carbon Emissions Avoided</span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-[#2f8f9d] flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-3xl font-bold text-[#14211a] tracking-tight">
                <AnimatedNumber
                  value={kpis?.co2e_avoided_kg}
                  decimals={1}
                  suffix=" kg"
                />
              </div>
              <div className="text-[11px] text-[#2f8f9d] font-semibold flex items-center gap-1 mt-1">
                <span>2.5 kg CO2e / kg food</span>
                <span className="text-[#728479] font-normal">• IPCC/FAO</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e3ded0]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#728479] font-mono">7-day trend</span>
              <Sparkline
                data={spark.co2e_avoided}
                color="#2f8f9d"
                fillColor="#2f8f9d"
                height={26}
                width={75}
              />
            </div>
          </div>
        </CardErrorBoundary>

        {/* KPI 4: Forecast Accuracy */}
        <CardErrorBoundary cardTitle="Forecast Accuracy" compact>
          <div className="p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs hover:border-forest-700/50 transition-all flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs text-[#728479] font-medium mb-1.5">
                <span>Forecast Accuracy (28d)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-forest-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="font-serif text-3xl font-bold text-[#14211a] tracking-tight">
                <AnimatedNumber
                  value={kpis?.forecast_accuracy_pct}
                  decimals={1}
                  suffix="%"
                />
              </div>
              <div className="text-[11px] text-forest-700 font-semibold flex items-center gap-1 mt-1">
                <span>8.06% MAPE</span>
                <span className="text-[#728479] font-normal">• Ridge Regression</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e3ded0]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#728479] font-mono">7-day trend</span>
              <Sparkline
                data={spark.accuracy}
                color="#2f5e2f"
                fillColor="#2f5e2f"
                height={26}
                width={75}
              />
            </div>
          </div>
        </CardErrorBoundary>
      </div>

      {/* 3. Main Operational Grid: 30-Day Waste Comparison + Next Service Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 30-Day "With vs Without PlateWise" Waste Chart */}
        <CardErrorBoundary cardTitle="30-Day Waste Trajectory Chart" className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs flex flex-col justify-between h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#14211a]">
                  With vs Without PlateWise — 30-Day Waste Trajectory
                </h2>
                <p className="text-xs text-[#728479]">
                  Comparing blind capacity prep (red line) against demand-calibrated batch cooking (green area).
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#c8553d]" />
                  <span className="text-[#728479]">Blind Guesswork (~25%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#3e9b66]" />
                  <span className="text-[#14211a] font-semibold">PlateWise (~8%)</span>
                </div>
              </div>
            </div>

            <div className="w-full h-72">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={overview.trends_30d}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPlatewise" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3e9b66" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3e9b66" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="colorGuesswork" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c8553d" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#c8553d" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3efe4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#728479"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      stroke="#728479"
                      fontSize={11}
                      tickLine={false}
                      unit="kg"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="guesswork_waste_kg"
                      name="Blind Guesswork Waste"
                      stroke="#c8553d"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGuesswork)"
                    />
                    <Area
                      type="monotone"
                      dataKey="platewise_waste_kg"
                      name="PlateWise Waste"
                      stroke="#3e9b66"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPlatewise)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-black/5 rounded-xl animate-pulse" />
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#e3ded0]/60 flex items-center justify-between text-xs text-[#728479]">
              <span className="font-mono">Held-out 30-day verified window</span>
              <span className="text-[#3e9b66] font-semibold">
                Net prevented: {formatKg(kpis?.kg_waste_prevented, 1)} food saved
              </span>
            </div>
          </div>
        </CardErrorBoundary>

        {/* Right Col: Next Service Card with Turnout Range Gauge & Approve Button */}
        <CardErrorBoundary cardTitle="Next Service Window">
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white to-[#FAF8F2] border border-[#e3ded0] shadow-xs flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-800 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Next Service Window
                </span>
                <div className="flex items-center gap-1 text-xs text-[#728479]">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>12:30 - 14:00</span>
                </div>
              </div>

              <h3 className="font-serif text-xl font-bold text-[#14211a]">
                {nextPlan.meal} Service
              </h3>
              <p className="text-xs text-[#728479] mb-4">
                {nextPlan.mess_name} • {nextPlan.date}
              </p>

              {/* Prep Summary Stats */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-forest-950/5 border border-[#e3ded0] mb-5">
                <div>
                  <div className="text-[10px] text-[#728479] uppercase tracking-wide">
                    Recommended Prep
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#14211a]">
                    {formatKg(nextPlan.total_recommended_kg, 1)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#728479] uppercase tracking-wide">
                    Total Portions
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#14211a]">
                    {formatNumber(nextPlan.total_recommended_servings)}
                  </div>
                </div>
              </div>

              {/* Turnout Range Gauge */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#14211a] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    Turnout Forecast:
                  </span>
                  <span className="font-mono font-bold text-[#14211a]">
                    {formatNumber(nextPlan.expected_turnout_range?.p50)} Diners
                  </span>
                </div>

                {/* Range Gauge Graphic */}
                <div className="relative pt-2 pb-5">
                  {/* Track */}
                  <div className="h-2.5 w-full bg-[#e3ded0] rounded-full overflow-hidden relative">
                    <div
                      className="absolute h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
                      style={{
                        left: "15%",
                        width: "70%",
                      }}
                    />
                  </div>
                  {/* Markers */}
                  <div className="flex justify-between text-[10px] font-mono text-[#728479] mt-1">
                    <span>p10: {formatNumber(nextPlan.expected_turnout_range?.p10)}</span>
                    <span className="font-bold text-forest-950">
                      p50: {formatNumber(nextPlan.expected_turnout_range?.p50)} (Expected)
                    </span>
                    <span>p90: {formatNumber(nextPlan.expected_turnout_range?.p90)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA: Approve Plan */}
            <div className="space-y-2 pt-2 border-t border-[#e3ded0]">
              <button
                type="button"
                onClick={handleApprovePlan}
                disabled={isApproving || approvedLocally}
                className={clsx(
                  "w-full py-3 px-4 rounded-xl font-sans text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus-ring",
                  approvedLocally
                    ? "bg-emerald-700 text-white cursor-default"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 active:scale-98"
                )}
              >
                {approvedLocally ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Production Plan Approved for Lunch</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4" />
                    <span>
                      {isApproving ? "Authorizing Plan..." : "Approve Kitchen Plan"}
                    </span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-between text-[10px] text-[#728479]">
                <span>Live RSVPs: {formatNumber(nextPlan.live_student_rsvp_count)}</span>
                <Link
                  href="/today"
                  className="text-amber-700 hover:underline flex items-center gap-0.5"
                >
                  <span>View Full Batch Sheet</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </CardErrorBoundary>
      </div>

      {/* 4. Secondary Row: Alerts Feed + Top Wasted Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Feed */}
        <CardErrorBoundary cardTitle="Operational Alerts Feed">
          <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-4 h-full">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Operational Alerts
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
                {overview.active_alerts?.length || 0} Active
              </span>
            </div>

            <div className="space-y-3">
              {(overview.active_alerts || []).map((alert) => (
                <div
                  key={alert.id}
                  className={clsx(
                    "p-3.5 rounded-xl border transition-all text-xs space-y-1.5",
                    alert.severity === "warning"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-950"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{alert.title}</span>
                    <span
                      className={clsx(
                        "text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold",
                        alert.severity === "warning"
                          ? "bg-amber-500/20 text-amber-800"
                          : "bg-emerald-500/20 text-emerald-800"
                      )}
                    >
                      {alert.action || alert.metric_delta || "Alert"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4a5a50] leading-snug">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardErrorBoundary>

        {/* Top Wasted Dishes Under Guesswork */}
        <CardErrorBoundary cardTitle="Top Historical Wasted Dishes Table" className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#14211a]">
                  Top Historical Wasted Dishes (Guesswork Baseline)
                </h3>
                <p className="text-xs text-[#728479]">
                  High-volume staples with greatest over-preparation margins before PlateWise demand control.
                </p>
              </div>
              <Link
                href="/menu"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <span>Menu Planner</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e3ded0] text-[#728479] font-medium">
                    <th className="pb-2.5">Dish</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5 text-right">Wasted Under Guesswork</th>
                    <th className="pb-2.5 text-right">Lost Capital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ded0]/60">
                  {(overview.top_wasted_dishes || []).map((dish) => {
                    const dishName = dish.name || dish.dish_name || dish.dish_id;
                    const dishCategory = dish.category || "curry";
                    const wasteKg = dish.guesswork_waste_kg ?? dish.total_waste_kg;
                    const costWasted = dish.cost_wasted_inr ?? dish.estimated_loss_inr;

                    return (
                      <tr key={dish.dish_id} className="hover:bg-black/[0.02]">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            <FoodIcon
                              dishId={dish.dish_id}
                              name={dishName}
                              category={dishCategory}
                              size="sm"
                            />
                            <span className="font-semibold text-[#14211a]">
                              {dishName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-[#728479] capitalize">
                          {dishCategory}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#c8553d]">
                          {formatKg(wasteKg, 1)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-amber-800 font-semibold">
                          {formatINR(costWasted)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardErrorBoundary>
      </div>

      {/* 5. 3D Kitchen Scene + Plate Studio Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* 3D Kitchen Scene with Oven & Parallax */}
        <CardErrorBoundary cardTitle="3D Kitchen Scene">
          <DashboardKitchenScene />
        </CardErrorBoundary>

        {/* Plate Studio Live Widget Card */}
        <CardErrorBoundary cardTitle="Plate Studio Intelligence">
          <div className="relative overflow-hidden p-6 rounded-2xl bg-[#182818] border border-emerald-500/25 shadow-md flex flex-col justify-between min-h-[220px] h-full">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Interactive Plate Studio
                </span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#f5eedc]">
                Plate Studio Intelligence
              </h3>
              <p className="text-xs text-[#f5eedc]/75 leading-relaxed max-w-md">
                Today&apos;s campus average plate: <span className="font-mono text-emerald-300 font-bold">~640 kcal</span> (Moderate), ₹28 raw cost, 310g CO2e. Build or customize a 3D thali and pre-order meal signals to help kitchen batch forecasting.
              </p>
            </div>
            <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <Link
                href="/plate-studio"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Build & Customize in Plate Studio</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <span className="text-[10px] font-mono text-emerald-400/60">
                Live 3D &bull; Kenney Models
              </span>
            </div>
          </div>
        </CardErrorBoundary>
      </div>
    </div>
  );
}
