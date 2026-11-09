"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  TrendingDown,
  IndianRupee,
  Utensils,
  RefreshCw,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { demoApi } from "@/lib/api";
import FoodIcon from "@/components/FoodIcon";
import ErrorStateCard from "@/components/shell/ErrorStateCard";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["Breakfast", "Lunch", "Dinner"];

export default function MenuPlannerPage() {
  const { activeMessId, activeMess } = useAppContext();
  const [menus, setMenus] = useState<any[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [addingToCell, setAddingToCell] = useState<{ day: number; meal: string } | null>(null);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuRes, foodsRes] = await Promise.all([
        demoApi.getWeeklyMenus(activeMessId),
        demoApi.getFoods(),
      ]);
      setMenus(menuRes.menus || []);
      setFoods(foodsRes.foods || []);
    } catch (err: any) {
      console.error("Failed to load menu planner:", err);
      setError(err?.message || "Failed to load cyclical menu data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [activeMessId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCellMenu = (day: number, meal: string) => {
    return menus.find(
      (m) => m.day_of_week === day && m.meal.toLowerCase() === meal.toLowerCase()
    );
  };

  const foodMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const f of foods) {
      map.set(f.id, f);
    }
    return map;
  }, [foods]);

  const handleRemoveDish = async (day: number, meal: string, dishId: string) => {
    const current = getCellMenu(day, meal);
    if (!current) return;
    const updatedDishes = current.dish_ids.filter((id: string) => id !== dishId);
    if (updatedDishes.length === 0) {
      showToast("A meal must have at least one dish.");
      return;
    }

    try {
      const res = await demoApi.setMenuCell({
        mess_id: activeMessId,
        day_of_week: day,
        meal: meal,
        dish_ids: updatedDishes,
      });
      setMenus((prev) =>
        prev.map((m) =>
          m.day_of_week === day && m.meal.toLowerCase() === meal.toLowerCase() ? res.menu : m
        )
      );
      showToast(`Removed dish from ${DAYS[day]} ${meal}.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to update cell.");
    }
  };

  const handleAddDish = async (day: number, meal: string, dishId: string) => {
    const current = getCellMenu(day, meal);
    const existing = current ? current.dish_ids : [];
    if (existing.includes(dishId)) {
      showToast("Dish is already in this meal slot.");
      setAddingToCell(null);
      return;
    }

    const updatedDishes = [...existing, dishId];
    try {
      const res = await demoApi.setMenuCell({
        mess_id: activeMessId,
        day_of_week: day,
        meal: meal,
        dish_ids: updatedDishes,
      });
      setMenus((prev) => {
        const found = prev.find(
          (m) => m.day_of_week === day && m.meal.toLowerCase() === meal.toLowerCase()
        );
        if (found) {
          return prev.map((m) =>
            m.day_of_week === day && m.meal.toLowerCase() === meal.toLowerCase() ? res.menu : m
          );
        }
        return [...prev, res.menu];
      });
      showToast(`Added ${foodMap.get(dishId)?.name || dishId} to ${DAYS[day]} ${meal}.`);
    } catch (err: any) {
      showToast(err?.message || "Failed to add dish.");
    } finally {
      setAddingToCell(null);
    }
  };

  const handleRunOptimizer = async () => {
    try {
      setOptimizing(true);
      const res = await demoApi.optimizeMenu(activeMessId);
      setSuggestions(res.suggestions || []);
      showToast(`AI analyzed consumption: ${res.suggestions?.length || 0} waste reduction swaps found!`);
    } catch (err: any) {
      showToast(err?.message || "Optimizer run failed.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplySuggestion = async (sug: any) => {
    const current = getCellMenu(sug.day_of_week, sug.meal);
    if (!current) return;
    const newDishes = current.dish_ids.map((id: string) =>
      id === sug.original_dish ? sug.recommended_swap : id
    );

    try {
      const res = await demoApi.setMenuCell({
        mess_id: activeMessId,
        day_of_week: sug.day_of_week,
        meal: sug.meal,
        dish_ids: newDishes,
      });
      setMenus((prev) =>
        prev.map((m) =>
          m.day_of_week === sug.day_of_week && m.meal.toLowerCase() === sug.meal.toLowerCase()
            ? res.menu
            : m
        )
      );
      setSuggestions((prev) =>
        prev
          ? prev.filter(
              (s) =>
                !(
                  s.day_of_week === sug.day_of_week &&
                  s.meal === sug.meal &&
                  s.original_dish === sug.original_dish
                )
            )
          : null
      );
      showToast(
        `Applied swap: ${sug.original_dish} → ${sug.recommended_swap} (${DAYS[sug.day_of_week]} ${sug.meal})`
      );
    } catch (err: any) {
      showToast(err?.message || "Failed to apply swap.");
    }
  };

  if (error && menus.length === 0) {
    return (
      <ErrorStateCard
        title="Unable to Load Cyclical Menu Roster"
        message={error}
        onRetry={fetchMenuData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400 flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>{activeMess?.name || "Active Mess"} &middot; 7x3 Cyclical Menu Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#f5eedc]">
              Menu Rotation & Waste Optimizer
            </h1>
            <p className="text-sm text-[#f5eedc]/70 mt-2 max-w-2xl leading-relaxed">
              Assign dishes from your institutional catalog. Each cell computes predicted
              post-service leftover weight and raw cost. Run the AI optimizer to identify
              low-consumption day-of-week slots and apply climate-saving swaps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunOptimizer}
              disabled={optimizing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{optimizing ? "Analyzing Patterns..." : "Run AI Optimizer"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {suggestions && suggestions.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#182d1c] to-[#142618] border border-emerald-400/40 shadow-xl space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Menu Optimizer: {suggestions.length} High-Impact Swaps Available</span>
            </div>
            <button
              onClick={() => setSuggestions(null)}
              className="text-[#f5eedc]/50 hover:text-[#f5eedc] text-xs"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#111e13] border border-emerald-500/25 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
                    <span>
                      {DAYS[sug.day_of_week]} &middot; {sug.meal}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <TrendingDown className="w-3.5 h-3.5" /> -{sug.projected_waste_reduction_kg} kg waste
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs my-1">
                    <span className="line-through text-rose-300/80">
                      {foodMap.get(sug.original_dish)?.name || sug.original_dish}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">
                      {foodMap.get(sug.recommended_swap)?.name || sug.recommended_swap}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#f5eedc]/70 mt-1">{sug.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15">
                  <span className="text-[10px] text-amber-300 font-mono">
                    Save ~₹{sug.projected_cost_saved_inr} per service
                  </span>
                  <button
                    onClick={() => handleApplySuggestion(sug)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Apply Swap
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7x3 Cyclical Grid */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-5 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="p-16 text-center text-xs text-[#f5eedc]/60">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading 7x3 cyclical menu for {activeMess?.name || "dining hall"}...
          </div>
        ) : (
          <div className="min-w-[850px] space-y-4">
            {DAYS.map((dayName, dayIndex) => (
              <div
                key={dayIndex}
                className="p-4 rounded-xl bg-[#132114] border border-emerald-500/15 hover:border-emerald-500/30 transition-colors"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-sm font-serif font-bold text-[#f5eedc]">{dayName}</h3>
                  </div>
                  <span className="text-[11px] text-[#f5eedc]/50">3 standard daily services</span>
                </div>

                {/* 3 Meals for this day */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MEALS.map((mealName) => {
                    const cell = getCellMenu(dayIndex, mealName);
                    const dishIds: string[] = cell?.dish_ids || [];
                    const isAdding =
                      addingToCell?.day === dayIndex && addingToCell?.meal === mealName;

                    return (
                      <div
                        key={mealName}
                        className="p-3 rounded-lg bg-[#0e190e] border border-emerald-500/15 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 pb-1.5 border-b border-emerald-500/10">
                            <span>{mealName}</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[#f5eedc]/60">
                              <span>~{cell?.predicted_waste_kg || 4.5}kg waste</span>
                              <span>₹{cell?.predicted_cost_inr || 140}</span>
                            </div>
                          </div>

                          {/* Dishes in this slot */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {dishIds.map((dId) => {
                              const food = foodMap.get(dId);
                              return (
                                <span
                                  key={dId}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/25 text-[11px] text-emerald-200"
                                >
                                  <FoodIcon dishId={dId} size="sm" className="!w-4 !h-4" />
                                  <span className="truncate max-w-[110px]">{food?.name || dId}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDish(dayIndex, mealName, dId)}
                                    aria-label={`Remove ${food?.name || dId} from ${dayName} ${mealName}`}
                                    className="text-emerald-400/50 hover:text-rose-300 transition-colors ml-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Add Dish Trigger / Picker */}
                        <div className="pt-2">
                          {isAdding ? (
                            <div className="p-2 rounded-lg bg-[#152415] border border-emerald-400/30 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                                <span>Choose Dish to Add:</span>
                                <button
                                  type="button"
                                  onClick={() => setAddingToCell(null)}
                                  className="text-[#f5eedc]/50 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddDish(dayIndex, mealName, e.target.value);
                                  }
                                }}
                                className="w-full bg-[#0d170d] border border-emerald-500/30 rounded-lg p-1.5 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                              >
                                <option value="" disabled>
                                  -- Select from catalog --
                                </option>
                                {foods.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.name} ({f.category}) - {Math.round(f.kcal_per_unit)} kcal
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAddingToCell({ day: dayIndex, meal: mealName })}
                              className="w-full py-1 rounded-md border border-dashed border-emerald-500/25 text-[10px] text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Dish
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
