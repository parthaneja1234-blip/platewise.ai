"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/shell/PageHeader";
import ErrorStateCard from "@/components/shell/ErrorStateCard";
import CardErrorBoundary from "@/components/CardErrorBoundary";
import AnimatedNumber from "@/components/AnimatedNumber";
import FoodIcon from "@/components/FoodIcon";
import {
  demoApi,
  ForecastParams,
  ForecastResult,
  BacktestResponse,
  TurnoutDriver,
} from "@/lib/api";
import {
  Sparkles,
  Sliders,
  Calendar,
  CloudRain,
  Thermometer,
  GraduationCap,
  CalendarDays,
  PartyPopper,
  Users,
  Scale,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  History,
  Target,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { formatNumber, formatPercent, formatKg } from "@/lib/formatters";
import { useAppContext } from "@/context/AppContext";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DOW = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const AVAILABLE_DISHES = [
  { id: "roti", name: "Tandoori Roti", category: "bread" },
  { id: "jeera-rice", name: "Jeera Rice", category: "rice" },
  { id: "dal-tadka", name: "Dal Tadka", category: "dal" },
  { id: "paneer-butter-masala", name: "Paneer Butter Masala", category: "curry" },
  { id: "chole-bhature", name: "Chole Bhature", category: "main" },
  { id: "poha", name: "Indori Poha", category: "breakfast" },
  { id: "curd", name: "Fresh Curd", category: "dairy" },
  { id: "salad", name: "Kachumber Salad", category: "side" },
];

export default function ForecastLabPage() {

  const { activeMessId, activeMess } = useAppContext();

  // Input Controls State
  const [messId, setMessId] = useState(activeMessId);
  const [meal, setMeal] = useState<"Breakfast" | "Lunch" | "Dinner">("Lunch");
  const [dayOfWeek, setDayOfWeek] = useState<number>(0); // Monday
  const [expectedTurnout, setExpectedTurnout] = useState<number>(activeMess.capacity || 850);
  const [historyWindow, setHistoryWindow] = useState<number>(92);
  const [temperature, setTemperature] = useState<number>(29.0);
  const [rainMm, setRainMm] = useState<number>(18.0);
  const [isExam, setIsExam] = useState<boolean>(false);

  useEffect(() => {
    setMessId(activeMessId);
    if (activeMess?.capacity) {
      setExpectedTurnout(activeMess.capacity);
    }
  }, [activeMessId, activeMess]);

  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [hasEvent, setHasEvent] = useState<boolean>(false);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([
    "roti",
    "jeera-rice",
    "dal-tadka",
    "paneer-butter-masala",
    "curd",
    "salad",
  ]);

  // Forecast API output & loading states
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pulse animation trigger when inputs change
  const [pulsePipeline, setPulsePipeline] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initial backtest fetch
  useEffect(() => {
    demoApi
      .getBacktest()
      .then((data) => setBacktestData(data))
      .catch((err) => console.warn("Backtest load warning:", err));
  }, []);

  // Debounced forecast runner
  const runForecast = useCallback(async () => {
    try {
      setIsCalculating(true);
      setError(null);
      setPulsePipeline(true);

      const params: ForecastParams = {
        mess_id: messId,
        day_of_week: dayOfWeek,
        meal,
        expected_turnout: expectedTurnout,
        is_exam: isExam,
        is_holiday: isHoliday,
        has_event: hasEvent,
        rain_mm: rainMm,
        temperature_c: temperature,
        menu: selectedDishes,
      };

      const result = await demoApi.postForecast(params);
      setForecastResult(result);
    } catch (err: any) {
      console.error("Forecast error:", err);
      setError(err?.message || "Prediction calculation failed.");
    } finally {
      setIsCalculating(false);
      setInitialLoading(false);
      setTimeout(() => setPulsePipeline(false), 600);
    }
  }, [
    messId,
    dayOfWeek,
    meal,
    expectedTurnout,
    isExam,
    isHoliday,
    hasEvent,
    rainMm,
    temperature,
    selectedDishes,
  ]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runForecast();
    }, 280);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [runForecast]);

  const toggleDish = (dishId: string) => {
    setSelectedDishes((prev) =>
      prev.includes(dishId)
        ? prev.length > 2
          ? prev.filter((d) => d !== dishId)
          : prev
        : [...prev, dishId]
    );
  };

  if (initialLoading && !forecastResult) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-black/5 rounded-2xl w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-[600px] bg-black/5 rounded-2xl" />
          <div className="lg:col-span-7 h-[600px] bg-black/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !forecastResult) {
    return (
      <ErrorStateCard
        title="Demand Forecast Engine Offline"
        message={error}
        onRetry={runForecast}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Page Header */}
      <PageHeader
        title="Demand Forecast Lab"
        subtitle="Live multi-variable simulation engine. Adjust turnout, weather, academic timetable, and dish configurations to observe real-time batch prep predictions."
        badge="Multi-Variable AI"
        tabs={[
          { label: "Overview", href: "/dashboard", active: false },
          { label: "Today's Plan", href: "/today", active: false },
          { label: "Forecast Lab", href: "/forecast", active: true },
          { label: "Simulate Today", href: "/simulate", active: false },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runForecast}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e3ded0] hover:border-amber-500/40 text-[#14211a] shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={clsx("w-3.5 h-3.5 text-amber-700", isCalculating && "animate-spin")}
              />
              <span>Recalculate</span>
            </button>
          </div>
        }
      />

      {/* 2. Animated Flow Visualization: Inputs -> Prediction Engine -> Recommended Output */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0e2412] via-[#1a3a1a] to-[#0e2412] text-[#FAF8F2] border border-amber-500/30 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Step 1: 6 Live Inputs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8fa896] font-mono">
                Step 1: Inputs
              </div>
              <div className="text-xs font-bold text-[#faf8f2]">
                6 Calibrated Variables
              </div>
              <div className="text-[10px] text-amber-300/80">
                Turnout, Weather, Timetable, Menu
              </div>
            </div>
          </div>

          {/* Animated Connecting Pulse */}
          <div className="flex items-center gap-1 text-amber-400/80">
            <span
              className={clsx(
                "w-2 h-2 rounded-full bg-amber-400 transition-all duration-300",
                pulsePipeline ? "scale-150 animate-ping" : "opacity-50"
              )}
            />
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Step 2: Prediction Engine */}
          <div
            className={clsx(
              "flex items-center gap-3 w-full md:w-auto p-2.5 rounded-xl transition-all duration-300",
              pulsePipeline
                ? "bg-amber-500/25 border border-amber-400 shadow-[0_0_15px_rgba(232,163,61,0.3)]"
                : "bg-forest-900/60 border border-amber-500/20"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8fa896] font-mono">
                Step 2: Engine
              </div>
              <div className="text-xs font-bold text-[#faf8f2]">
                Ridge Regression Core
              </div>
              <div className="text-[10px] text-emerald-400">
                8.06% MAPE • p10-p90 Intervals
              </div>
            </div>
          </div>

          {/* Animated Connecting Pulse */}
          <div className="flex items-center gap-1 text-amber-400/80">
            <span
              className={clsx(
                "w-2 h-2 rounded-full bg-amber-400 transition-all duration-300",
                pulsePipeline ? "scale-150 animate-ping" : "opacity-50"
              )}
            />
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Step 3: Recommended Servings/Kg */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#8fa896] font-mono">
                Step 3: Recommendation
              </div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                {forecastResult ? `${forecastResult.total_recommended_kg} kg Prep` : "--"}
              </div>
              <div className="text-[10px] text-[#8fa896]">
                {forecastResult ? `${forecastResult.predicted_turnout} Expected Diners` : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split: Left 5 Cols (Input Controls) vs Right 7 Cols (Results & Explainability) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: The Six Deck Live Controls */}
        <div className="lg:col-span-5">
          <CardErrorBoundary cardTitle="Scenario Simulation Controls">
            <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
                <h2 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-700" />
                  Scenario Control Deck
                </h2>
            <span className="text-[10px] font-mono text-[#728479]">
              {isCalculating ? "Updating model..." : "Live reactive"}
            </span>
          </div>

          {/* Input 1: Day of Week */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14211a] flex items-center justify-between">
              <span>Day of the Week</span>
              <span className="text-[11px] font-mono text-amber-800 font-semibold">
                {FULL_DOW[dayOfWeek]}
              </span>
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DOW_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDayOfWeek(idx)}
                  className={clsx(
                    "py-1.5 rounded-xl text-xs font-bold transition-all focus-ring cursor-pointer",
                    dayOfWeek === idx
                      ? "bg-[#0e2412] text-[#faf8f2] shadow-xs"
                      : "bg-[#FAF8F2] text-[#4a5a50] hover:text-[#14211a] hover:bg-[#f3efe4]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Expected Headcount Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[#14211a] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>Turnout Anchor (Capacity: 850)</span>
              </label>
              <span className="font-mono font-bold text-[#14211a]">
                {expectedTurnout} diners
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="1200"
              step="10"
              value={expectedTurnout}
              onChange={(e) => setExpectedTurnout(Number(e.target.value))}
              className="w-full accent-[#0e2412] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#728479]">
              <span>Min: 200</span>
              <span>Nominal: 850</span>
              <span>Max: 1,200</span>
            </div>
          </div>

          {/* Input 3: Weather (Rainfall & Temperature) */}
          <div className="space-y-3 p-3.5 rounded-xl bg-forest-950/[0.02] border border-[#e3ded0]">
            <div className="flex items-center justify-between text-xs font-bold text-[#14211a]">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-sky-700" />
                Precipitation & Weather Impact
              </span>
              <span className="font-mono text-sky-800">{formatNumber(rainMm, 0)} mm</span>
            </div>

            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={rainMm}
              onChange={(e) => setRainMm(Number(e.target.value))}
              className="w-full accent-sky-700 cursor-pointer"
            />

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setRainMm(0)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                  rainMm === 0
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-[#4a5a50] border-[#e3ded0] hover:bg-[#FAF8F2]"
                )}
              >
                Clear (0mm)
              </button>
              <button
                type="button"
                onClick={() => setRainMm(8)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                  rainMm === 8
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-[#4a5a50] border-[#e3ded0] hover:bg-[#FAF8F2]"
                )}
              >
                Drizzle (8mm)
              </button>
              <button
                type="button"
                onClick={() => setRainMm(28)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer",
                  rainMm === 28
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-[#4a5a50] border-[#e3ded0] hover:bg-[#FAF8F2]"
                )}
              >
                Monsoon (28mm)
              </button>
            </div>

            {/* Temperature Slider */}
            <div className="pt-2 border-t border-[#e3ded0]/60 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#728479] flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  Ambient Temperature:
                </span>
                <span className="font-mono font-bold text-[#14211a]">
                  {formatNumber(temperature, 0)}°C
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Input 4: Academic Timetable & Event Switches */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14211a]">
              Campus Context Toggles
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIsExam(!isExam)}
                className={clsx(
                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 focus-ring",
                  isExam
                    ? "bg-amber-500/20 border-amber-500 text-amber-950 font-bold"
                    : "bg-[#FAF8F2] border-[#e3ded0] text-[#728479] hover:text-[#14211a]"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Exam Period</span>
                <span className="text-[9px] font-mono">{isExam ? "-16%" : "Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHoliday(!isHoliday)}
                className={clsx(
                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 focus-ring",
                  isHoliday
                    ? "bg-rose-500/20 border-rose-500 text-rose-950 font-bold"
                    : "bg-[#FAF8F2] border-[#e3ded0] text-[#728479] hover:text-[#14211a]"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Holiday</span>
                <span className="text-[9px] font-mono">{isHoliday ? "-28%" : "Off"}</span>
              </button>

              <button
                type="button"
                onClick={() => setHasEvent(!hasEvent)}
                className={clsx(
                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 focus-ring",
                  hasEvent
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-950 font-bold"
                    : "bg-[#FAF8F2] border-[#e3ded0] text-[#728479] hover:text-[#14211a]"
                )}
              >
                <PartyPopper className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Campus Fest</span>
                <span className="text-[9px] font-mono">{hasEvent ? "+14%" : "Off"}</span>
              </button>
            </div>
          </div>

          {/* Input 5: History Window Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-[#14211a] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-700" />
                <span>Training History Window</span>
              </label>
              <span className="font-mono text-amber-800 font-semibold">{historyWindow} Days</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[30, 60, 92, 120].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setHistoryWindow(days)}
                  className={clsx(
                    "py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                    historyWindow === days
                      ? "bg-[#0e2412] text-[#faf8f2] border-[#0e2412]"
                      : "bg-[#FAF8F2] text-[#4a5a50] border-[#e3ded0] hover:bg-[#f3efe4]"
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>

          {/* Input 6: Menu Dish Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#14211a]">
              Menu Staple Composition ({selectedDishes.length} selected)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_DISHES.map((dish) => {
                const isSelected = selectedDishes.includes(dish.id);
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => toggleDish(dish.id)}
                    className={clsx(
                      "px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer focus-ring",
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-950 font-semibold"
                        : "bg-white border-[#e3ded0] text-[#728479] hover:text-[#14211a]"
                    )}
                  >
                    <FoodIcon dishId={dish.id} size="sm" className="w-4 h-4 rounded-sm" />
                    <span>{dish.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardErrorBoundary>
    </div>

        {/* RIGHT COLUMN: Results, Waterfall, and Backtest Validation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Result Card: Predicted Turnout & Recommended Weight */}
          {forecastResult ? (
            <CardErrorBoundary cardTitle="Attendance & Weight Forecast" onRetry={runForecast}>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-[#FAF8F2] border border-[#e3ded0] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e3ded0] pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Model Output
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#14211a] mt-1">
                      {formatKg(forecastResult.total_recommended_kg, 1)} Prep Recommended
                    </h3>
                    <p className="text-xs text-[#728479]">
                      Sized for {formatNumber(forecastResult.predicted_turnout)} expected diners (80% confidence: {formatNumber(forecastResult.turnout_range?.p10)} - {formatNumber(forecastResult.turnout_range?.p90)})
                    </p>
                  </div>

                  {/* Guesswork Comparison Pill */}
                  <div className="p-3 rounded-xl bg-forest-950/5 border border-[#e3ded0] text-right">
                    <div className="text-[10px] text-[#728479] uppercase">
                      Prevented Over-Prep
                    </div>
                    <div className="font-serif text-xl font-bold text-[#3e9b66]">
                      -{formatKg(forecastResult.guesswork_comparison?.prevented_prep_kg, 1)}
                    </div>
                    <div className="text-[10px] text-[#728479]">
                      vs {formatKg(forecastResult.guesswork_comparison?.guesswork_prep_kg, 1)} guesswork
                    </div>
                  </div>
                </div>

                {/* Per-Dish Recipe Quantities */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#14211a]">
                    Recipe Batch Quantities
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(forecastResult.dish_recommendations || []).map((d) => (
                      <div
                        key={d.dish_id}
                        className="p-2.5 rounded-xl bg-white border border-[#e3ded0] flex items-center gap-2.5 shadow-2xs"
                      >
                        <FoodIcon dishId={d.dish_id} size="sm" />
                        <div className="overflow-hidden">
                          <div className="font-semibold text-xs text-[#14211a] truncate">
                            {d.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#3e9b66] font-bold">
                            {formatKg(d.recommended_kg, 1)}{" "}
                            <span className="text-[#728479] font-normal font-sans">
                              ({formatNumber(d.recommended_servings)} ptn)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Driver Waterfall Attribution */}
                <div className="space-y-3 pt-3 border-t border-[#e3ded0]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#14211a]">
                      Headcount Attribution Breakdown
                    </span>
                    <span className="text-[10px] font-mono text-[#728479]">
                      Nominal Base: {formatNumber(forecastResult.nominal_base_turnout)} Diners
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(forecastResult.drivers || []).map((drv, idx) => {
                      const isPos = drv.direction === "positive";
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-[#e3ded0] flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#14211a]">{drv.name}</div>
                            <div className="text-[10px] text-[#728479]">{drv.description}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-20 h-2 bg-[#e3ded0] rounded-full overflow-hidden">
                              <div
                                className={clsx(
                                  "h-full rounded-full",
                                  isPos ? "bg-emerald-600" : "bg-[#c8553d]"
                                )}
                                style={{
                                  width: `${Math.min(100, Math.abs(drv.impact_pct) * 5)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={clsx(
                                "font-mono font-bold w-12 text-right",
                                isPos ? "text-emerald-700" : "text-[#c8553d]"
                              )}
                            >
                              {isPos ? "+" : ""}
                              {drv.impact_pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardErrorBoundary>
          ) : null}

          {/* Backtest Validation Card */}
          {backtestData ? (
            <CardErrorBoundary cardTitle="Backtest Model Performance">
              <div className="p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-700" />
                      Honest 28-Day Backtest Accuracy
                    </h3>
                    <p className="text-xs text-[#728479]">
                      Trained on {backtestData.training_days} days, tested on {backtestData.test_days} held-out days ({backtestData.test_samples} meal shifts).
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 font-semibold">
                    MAPE {formatPercent(backtestData.baselines?.platewise?.mape, 1)}
                  </span>
                </div>

                {/* 3 Baselines Comparison Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PlateWise */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-emerald-800 font-semibold">
                      PlateWise AI
                    </div>
                    <div className="font-serif text-2xl font-bold text-emerald-950">
                      {formatPercent(backtestData.baselines?.platewise?.mape, 1)}
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      RMSE: ±{formatNumber(backtestData.baselines?.platewise?.rmse)} diners
                    </div>
                  </div>

                  {/* Same Weekday Last Week */}
                  <div className="p-3.5 rounded-xl bg-forest-950/5 border border-[#e3ded0] space-y-1">
                    <div className="text-[10px] font-mono uppercase text-[#728479]">
                      Same Weekday Prior Wk
                    </div>
                    <div className="font-serif text-2xl font-bold text-[#14211a]">
                      {formatPercent(backtestData.baselines?.same_weekday_last_week?.mape, 1)}
                    </div>
                    <div className="text-[10px] text-[#728479]">
                      RMSE: ±{formatNumber(backtestData.baselines?.same_weekday_last_week?.rmse)} diners
                    </div>
                  </div>

                  {/* Cook for Capacity */}
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-rose-800 font-semibold">
                      Cook for Capacity (+5%)
                    </div>
                    <div className="font-serif text-2xl font-bold text-rose-950">
                      {formatPercent(backtestData.baselines?.cook_for_capacity?.mape, 1)}
                    </div>
                    <div className="text-[10px] text-rose-700">
                      RMSE: ±{formatNumber(backtestData.baselines?.cook_for_capacity?.rmse)} diners
                    </div>
                  </div>
                </div>

                {/* Error Reduction Stats */}
                <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] flex items-center justify-between text-xs">
                  <span className="text-[#14211a] font-medium">
                    Error Reduction vs Capacity:{" "}
                    <strong className="text-emerald-700 font-mono">
                      -{formatPercent(backtestData.error_reduction_vs_capacity_pct, 1)}
                    </strong>
                  </span>
                  <span className="text-[#14211a] font-medium">
                    Error Reduction vs Prior Week:{" "}
                    <strong className="text-emerald-700 font-mono">
                      -{formatPercent(backtestData.error_reduction_vs_last_week_pct, 1)}
                    </strong>
                  </span>
                </div>
              </div>
            </CardErrorBoundary>
          ) : null}
        </div>
      </div>
    </div>
  );
}
