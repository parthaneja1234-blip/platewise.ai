"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/shell/PageHeader";
import FoodIcon from "@/components/FoodIcon";
import AnimatedNumber from "@/components/AnimatedNumber";
import { useToast } from "@/components/Toast";
import { demoApi, PlanResponse, DishRecommendation, TurnoutDriver } from "@/lib/api";
import {
  ChefHat,
  Printer,
  CheckCircle2,
  Clock,
  Users,
  ShieldAlert,
  Flame,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  PhoneCall,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Calendar,
} from "lucide-react";
import clsx from "clsx";

const MEALS = ["Breakfast", "Lunch", "Dinner"] as const;
type MealType = (typeof MEALS)[number];

export default function TodayPlanPage() {
  const { toast } = useToast();

  const [activeMeal, setActiveMeal] = useState<MealType>("Lunch");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);

  // Approval state
  const [isApproving, setIsApproving] = useState(false);
  const [approvedLocally, setApprovedLocally] = useState(false);

  // Food-safety countdown timer state (3.5 hours = 12600 seconds)
  const [countdownSeconds, setCountdownSeconds] = useState(3.5 * 3600);

  const fetchPlan = useCallback(async (meal: MealType) => {
    try {
      setLoading(true);
      setError(null);
      const data = await demoApi.getPlan({
        mess_id: "mess-boys-a",
        meal,
      });
      setPlan(data);
      setApprovedLocally(data.is_approved);
      // Reset countdown to shelf life in hours from API
      if (data.surplus_risk?.shelf_life_hours) {
        setCountdownSeconds(Math.round(data.surplus_risk.shelf_life_hours * 3600));
      }
    } catch (err: any) {
      console.error("Failed to load meal plan:", err);
      setError(err?.message || "Could not fetch kitchen batch preparation schedule.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(activeMeal);
  }, [activeMeal, fetchPlan]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleApprovePlan = async () => {
    if (!plan) return;
    try {
      setIsApproving(true);
      await demoApi.approvePlan({
        mess_id: plan.mess_id,
        date: plan.date,
        meal: plan.meal,
      });
      setApprovedLocally(true);
      toast({
        type: "success",
        title: "Kitchen Production Authorized",
        description: `Batch cook plan for ${plan.meal} (${plan.total_recommended_kg} kg across ${plan.dishes.length} dishes) sent to kitchen stations.`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Approval Failed",
        description: err?.message || "Could not approve kitchen production schedule.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleNotifyVolunteer = (partnerName: string) => {
    toast({
      type: "info",
      title: "Redistribution Standby Triggered",
      description: `Dispatched volunteer standby ping to ${partnerName}. Surplus collection verified for post-service window.`,
    });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-black/5 rounded-2xl w-2/3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 bg-black/5 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-black/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !plan) {
    return (
      <div className="p-8 my-8 rounded-3xl bg-rose-500/10 border border-rose-500/25 text-rose-950 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-600 mb-3" />
        <h3 className="font-serif text-lg font-bold mb-1">
          Unable to Load Cook Sheet
        </h3>
        <p className="text-xs text-rose-800/80 mb-5 leading-relaxed">
          {error || "Communication failure with the kitchen schedule engine."}
        </p>
        <button
          onClick={() => fetchPlan(activeMeal)}
          className="px-4 py-2 rounded-xl bg-forest-900 text-[#FAF8F2] text-xs font-semibold hover:bg-forest-800 flex items-center gap-2 transition-all cursor-pointer focus-ring"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Page Header with Mess Tabs */}
      <PageHeader
        title="Today's Batch Cook Sheet"
        subtitle="Demand-calibrated recipe production schedule. Cook to forecasted headcount distribution and mitigate over-prep."
        badge="Staged Cooking"
        tabs={[
          { label: "Overview", href: "/dashboard", active: false },
          { label: "Today's Plan", href: "/today", active: true },
          { label: "Plate Studio", href: "/plate-studio", active: false },
          { label: "Log Meals", href: "/log", active: false },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e3ded0] hover:border-amber-500/40 text-[#14211a] shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-700" />
              <span>Print Station Token Sheet</span>
            </button>
            <button
              type="button"
              onClick={handleApprovePlan}
              disabled={isApproving || approvedLocally}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer focus-ring",
                approvedLocally
                  ? "bg-emerald-700 text-white cursor-default"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 active:scale-98"
              )}
            >
              {approvedLocally ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Plan Approved</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>{isApproving ? "Authorizing..." : "Approve Kitchen Plan"}</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* 2. Meal Selector Tabs & Service Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs">
        {/* Meal Tabs */}
        <div className="flex items-center gap-2">
          {MEALS.map((m) => {
            const isActive = activeMeal === m;
            return (
              <button
                key={m}
                onClick={() => setActiveMeal(m)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all focus-ring cursor-pointer",
                  isActive
                    ? "bg-[#0e2412] text-[#faf8f2] shadow-xs"
                    : "bg-forest-950/5 text-[#4a5a50] hover:text-[#14211a] hover:bg-forest-950/10"
                )}
              >
                {m} Service
              </button>
            );
          })}
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="text-[#728479]">Total Batch Weight:</span>
            <span className="font-mono font-bold text-[#14211a]">
              {plan.total_recommended_kg} kg
            </span>
          </div>
          <div className="h-4 w-px bg-[#e3ded0]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#728479]">Expected Diners:</span>
            <span className="font-mono font-bold text-[#14211a]">
              {plan.expected_turnout_range.p50}
            </span>
          </div>
          <div className="h-4 w-px bg-[#e3ded0]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[#728479]">Readiness:</span>
            <span className="text-emerald-700 font-bold">100% Ready</span>
          </div>
        </div>
      </div>

      {/* 3. Per-Dish Preparation Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[#14211a]">
            Station Dish Recommendations ({plan.dishes.length} Recipes)
          </h2>
          <span className="text-xs text-[#728479]">
            Targeting 6% buffer against recipe stockouts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan.dishes.map((dish) => {
            const vsDiff = dish.vs_last_week_servings ?? 0;
            const vsPct = dish.vs_last_week_pct ?? 0;
            const isIncrease = vsDiff > 0;

            return (
              <div
                key={dish.dish_id}
                className="p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between"
              >
                {/* Header: FoodIcon, Name, Category */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <FoodIcon
                        dishId={dish.dish_id}
                        name={dish.name}
                        category={dish.category}
                        size="md"
                      />
                      <div>
                        <h3 className="font-serif text-sm font-bold text-[#14211a] leading-tight">
                          {dish.name}
                        </h3>
                        <span className="text-[10px] text-[#728479] capitalize font-medium">
                          {dish.category} • {(dish.portion_kg * 1000).toFixed(0)}g / portion
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-forest-950/5 text-[#4a5a50] border border-[#e3ded0]">
                      ₹{dish.cost_per_kg_inr}/kg
                    </span>
                  </div>

                  {/* Recommended Quantities: Servings & Kg */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] my-3">
                    <div>
                      <div className="text-[10px] text-[#728479] uppercase tracking-wide">
                        Target Prep
                      </div>
                      <div className="font-serif text-xl font-bold text-[#14211a]">
                        {dish.recommended_kg}{" "}
                        <span className="text-xs font-normal text-[#728479]">kg</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#728479] uppercase tracking-wide">
                        Portions
                      </div>
                      <div className="font-serif text-xl font-bold text-[#14211a]">
                        {dish.recommended_servings.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Driver Chips */}
                  {dish.driver_chips && dish.driver_chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dish.driver_chips.map((chip, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: Vs Last Week & Confidence Bar */}
                <div className="pt-3 border-t border-[#e3ded0]/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#728479]">vs Prior Week:</span>
                    <span
                      className={clsx(
                        "font-mono font-bold flex items-center gap-0.5",
                        isIncrease ? "text-emerald-700" : "text-[#c8553d]"
                      )}
                    >
                      {isIncrease ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isIncrease ? "+" : ""}
                        {vsDiff} portions ({vsPct > 0 ? "+" : ""}
                        {vsPct}%)
                      </span>
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#728479]">
                      <span>Model Confidence</span>
                      <span className="font-mono font-bold text-forest-950">
                        {dish.confidence_pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#e3ded0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#3e9b66] rounded-full"
                        style={{ width: `${dish.confidence_pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Turnout Drivers Waterfall + Gauge Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#14211a]">
                Why This Headcount? — Turnout Driver Waterfall
              </h3>
              <p className="text-xs text-[#728479]">
                Ridge model attribution showing how calendar, academic, and weather signals shift expected attendance.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-forest-950/5 text-[#4a5a50] border border-[#e3ded0]">
              Explainable AI
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {plan.turnout_drivers.map((driver, idx) => {
              const isPos = driver.direction === "positive";
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-forest-950/[0.02] border border-[#e3ded0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#14211a]">
                        {driver.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-forest-950/5 text-[#728479] uppercase">
                        {driver.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#728479]">
                      {driver.description}
                    </p>
                  </div>

                  {/* Impact badge with bar */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-2 bg-[#e3ded0] rounded-full overflow-hidden flex">
                      {isPos ? (
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.abs(driver.impact_pct) * 5)}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-[#c8553d] rounded-full"
                          style={{ width: `${Math.min(100, Math.abs(driver.impact_pct) * 5)}%` }}
                        />
                      )}
                    </div>
                    <span
                      className={clsx(
                        "font-mono font-bold w-14 text-right",
                        isPos ? "text-emerald-700" : "text-[#c8553d]"
                      )}
                    >
                      {isPos ? "+" : ""}
                      {driver.impact_pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Turnout Distribution Gauge Card */}
        <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-base font-bold text-[#14211a]">
                Turnout Confidence Gauge
              </h3>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-[#728479]">
              Estimated 80% confidence interval across the student body.
            </p>

            <div className="my-6 p-4 rounded-xl bg-gradient-to-br from-[#0e2412] to-[#1a3a1a] text-[#FAF8F2] text-center space-y-1">
              <span className="text-[10px] text-amber-300 uppercase tracking-widest font-mono font-semibold">
                Expected Diners (p50)
              </span>
              <div className="font-serif text-4xl font-bold tracking-tight text-white">
                <AnimatedNumber
                  value={plan.expected_turnout_range.p50}
                  duration={700}
                />
              </div>
              <div className="text-[11px] text-[#8fa896] pt-1">
                Bounds: {plan.expected_turnout_range.p10} to {plan.expected_turnout_range.p90} diners
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e3ded0]/60">
                <span className="text-[#728479]">Lower Bound (p10):</span>
                <span className="font-mono font-bold text-[#14211a]">
                  {plan.expected_turnout_range.p10} Diners
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e3ded0]/60">
                <span className="text-[#728479]">Upper Bound (p90):</span>
                <span className="font-mono font-bold text-[#14211a]">
                  {plan.expected_turnout_range.p90} Diners
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#728479]">Live Student RSVP Signal:</span>
                <span className="font-mono font-bold text-amber-700">
                  {plan.live_student_rsvp_count >= 0 ? "+" : ""}
                  {plan.live_student_rsvp_count} Net
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e3ded0] text-[10px] text-[#728479]">
            Headcount calibrated with 120-day historical attendance records.
          </div>
        </div>
      </div>

      {/* 5. Surplus-Risk Meter with Food-Safety Countdown & Redistribution Partners */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F2] border border-[#e3ded0] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3ded0] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif text-lg font-bold text-[#14211a]">
                Surplus Rescue & Food-Safety Timer
              </h3>
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider",
                  plan.surplus_risk.level === "Low"
                    ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                )}
              >
                {plan.surplus_risk.level} Surplus Risk ({plan.surplus_risk.risk_score}/100)
              </span>
            </div>
            <p className="text-xs text-[#728479]">
              FSSAI compliance: hot-held food at 65°C must be consumed or safely chilled within 4 hours.
            </p>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0e2412] text-amber-300 border border-amber-500/30 shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#8fa896]">
                Holding Window Remaining
              </div>
              <div className="font-mono text-base font-bold tabular-nums text-white">
                {formatCountdown(countdownSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-forest-950/5 border border-[#e3ded0] flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-[10px] text-[#728479] uppercase">
                Holding Temperature
              </div>
              <div className="font-mono text-sm font-bold text-[#14211a]">
                {plan.surplus_risk.hot_holding_temp_c}°C (Active Steam Table)
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-950/5 border border-[#e3ded0] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] text-[#728479] uppercase">
                Max Safe Shelf Life
              </div>
              <div className="font-mono text-sm font-bold text-[#14211a]">
                {plan.surplus_risk.shelf_life_hours} Hours from service initiation
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-forest-950/5 border border-[#e3ded0] flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <div className="text-[10px] text-[#728479] uppercase">
                Surplus Probability
              </div>
              <div className="font-mono text-sm font-bold text-[#3e9b66]">
                Under 8.5% with PlateWise
              </div>
            </div>
          </div>
        </div>

        {/* Redistribution Partner Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#14211a]">
            <span>Verified Redistribution NGO Partners:</span>
            <span className="text-[10px] text-[#728479] font-normal">
              One-click volunteer notification on service completion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.surplus_risk.redistribution_partners.map((partner, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-[#e3ded0] shadow-xs flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
              >
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#14211a]">
                    {partner.name}
                  </h4>
                  <div className="text-[11px] text-[#728479] font-mono mt-0.5">
                    {partner.contact} • Pickup ETA ~{partner.eta_minutes} mins
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotifyVolunteer(partner.name)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-ring shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                  <span>Notify Volunteers</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
