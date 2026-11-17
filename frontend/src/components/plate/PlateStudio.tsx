"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Sparkles,
  Plus,
  Minus,
  Save,
  Share2,
  Trash2,
  Info,
  CheckCircle2,
  Layers,
  Flame,
  Leaf,
  IndianRupee,
  Sliders,
  UtensilsCrossed,
  RotateCcw,
} from "lucide-react";
import { demoApi } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import FoodIcon from "@/components/FoodIcon";
import AnimatedNumber from "@/components/AnimatedNumber";

// Dynamic import with SSR disabled for Three.js canvas
const Plate3DCanvas = dynamic(() => import("./Plate3DCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center bg-black/20 rounded-2xl border border-emerald-500/15">
      <div className="text-center text-xs text-[#f5eedc]/60">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Initializing 3D Canvas...
      </div>
    </div>
  ),
});

export interface SelectedPlateItem {
  food_id: string;
  name: string;
  count: number;
  model_id?: string;
  icon_id?: string;
  kcal_per_unit: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  cost_inr_per_unit?: number;
  co2e_g_per_unit?: number;
}

export interface PlateStudioProps {
  isStudentView?: boolean;
}

export default function PlateStudio({ isStudentView = false }: PlateStudioProps) {
  const { activeMessId, activeMess } = useAppContext();

  const [foods, setFoods] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({
    roti: 2,
    "dal-tadka": 1,
    "jeera-rice": 1,
    curd: 1,
  });

  const [plateVariant, setPlateVariant] = useState<"plate" | "thali">("thali");
  const [popularPlates, setPopularPlates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plateName, setPlateName] = useState("My Custom Study Plate");
  const [selectedMeal, setSelectedMeal] = useState("Lunch");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessBurst, setSaveSuccessBurst] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for student food palette
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Thresholds for Light / Moderate / Hearty
  const [showThresholdSliders, setShowThresholdSliders] = useState(false);
  const [lightThreshold, setLightThreshold] = useState(450);
  const [moderateThreshold, setModerateThreshold] = useState(850);

  const fetchFoodsAndPlates = async () => {
    try {
      setLoading(true);
      const [foodsRes, popularRes] = await Promise.all([
        demoApi.getFoods(),
        demoApi.getPopularPlates(),
      ]);
      setFoods(foodsRes.foods || []);
      setPopularPlates(popularRes.popular_plates || []);
    } catch (err) {
      console.error("Failed to load plate studio data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodsAndPlates();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const foodMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const f of foods) {
      map.set(f.id, f);
    }
    return map;
  }, [foods]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const f of foods) {
      if (f.category) set.add(f.category);
    }
    return ["all", ...Array.from(set)];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesCat =
        selectedCategory === "all" || f.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        (f.name && f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchesCat && matchesSearch;
    });
  }, [foods, selectedCategory, searchQuery]);

  const activePlateItems: SelectedPlateItem[] = useMemo(() => {
    const result: SelectedPlateItem[] = [];
    for (const [id, count] of Object.entries(selectedItems)) {
      if (count > 0) {
        const info = foodMap.get(id);
        result.push({
          food_id: id,
          name: info?.name || id,
          count,
          model_id: info?.model_id,
          icon_id: info?.icon_id || id,
          kcal_per_unit: info?.kcal_per_unit || 100,
          protein_g: info?.protein_g || 0,
          carbs_g: info?.carbs_g || 0,
          fat_g: info?.fat_g || 0,
          cost_inr_per_unit: info?.cost_inr_per_unit || 10,
          co2e_g_per_unit: info?.co2e_g_per_unit || 80,
        });
      }
    }
    return result;
  }, [selectedItems, foodMap]);

  // Compute live nutritional & environmental totals
  const totals = useMemo(() => {
    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let cost = 0;
    let co2e = 0;

    for (const item of activePlateItems) {
      kcal += item.kcal_per_unit * item.count;
      protein += (item.protein_g || 0) * item.count;
      carbs += (item.carbs_g || 0) * item.count;
      fat += (item.fat_g || 0) * item.count;
      cost += (item.cost_inr_per_unit || 0) * item.count;
      co2e += (item.co2e_g_per_unit || 0) * item.count;
    }

    let descriptor = "Moderate";
    if (kcal < lightThreshold) {
      descriptor = "Light";
    } else if (kcal > moderateThreshold) {
      descriptor = "Hearty";
    }

    let hint = "Balanced collegiate meal selection.";
    if (protein >= 25) {
      hint = "High protein combination supporting active physical & sports recovery.";
    } else if (co2e <= 250 && kcal >= 400) {
      hint = "Climate-efficient plate selection with low supply-chain emissions.";
    } else if (carbs >= 85) {
      hint = "Sustained carbohydrate profile suited for endurance study schedules.";
    }

    return {
      kcal: Math.round(kcal),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      cost: Math.round(cost * 10) / 10,
      co2e: Math.round(co2e),
      descriptor,
      hint,
    };
  }, [activePlateItems, lightThreshold, moderateThreshold]);

  // Count unverified foods on active plate
  const unverifiedItemsCount = useMemo(() => {
    return activePlateItems.filter((item) => {
      const info = foodMap.get(item.food_id);
      return !info?.verified;
    }).length;
  }, [activePlateItems, foodMap]);

  const handleItemCountChange = (foodId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[foodId] || 0;
      const next = Math.max(0, Math.min(8, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      }
      return { ...prev, [foodId]: next };
    });
  };

  const handleResetPlate = () => {
    setSelectedItems({});
  };

  const handleLoadPopularPlate = (preset: any) => {
    const newItems: Record<string, number> = {};
    for (const it of preset.items) {
      newItems[it.food_id] = it.count;
    }
    setSelectedItems(newItems);
    setPlateName(preset.name);
    showToast(`Loaded preset "${preset.name}".`);
  };

  const handleSavePlate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activePlateItems.length === 0) {
      showToast("Cannot save empty plate. Add at least one food item.");
      return;
    }

    try {
      setIsSaving(true);
      const itemsPayload = activePlateItems.map((it) => ({
        food_id: it.food_id,
        count: it.count,
      }));

      const res = await demoApi.savePlate({
        name: plateName,
        items: itemsPayload,
        mess_id: activeMessId,
        meal: selectedMeal,
      });

      showToast(`Saved "${res.plate.name}" as pre-order demand signal.`);
      setSaveSuccessBurst(true);
      setTimeout(() => setSaveSuccessBurst(false), 3500);
      const popularRes = await demoApi.getPopularPlates();
      setPopularPlates(popularRes.popular_plates || []);
    } catch (err: any) {
      showToast(err?.message || "Failed to save plate.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSavedPlate = async (plateId: string) => {
    try {
      await demoApi.deletePlate(plateId);
      showToast("Plate removed.");
      const popularRes = await demoApi.getPopularPlates();
      setPopularPlates(popularRes.popular_plates || []);
    } catch (err: any) {
      showToast(err?.message || "Failed to delete plate.");
    }
  };

  const handleSharePlate = () => {
    const text = `🍽️ PlateWise AI Plate: ${plateName}\nEnergy: ${totals.kcal} kcal (${totals.descriptor})\nMacros: ${totals.protein}g Protein | ${totals.carbs}g Carbs | ${totals.fat}g Fat\nCost: ₹${totals.cost} | CO2e: ${totals.co2e}g\nFacility: ${activeMess?.name}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Plate nutrition card copied to clipboard!");
    }
  };

  if (isStudentView) {
    const totalPlateItemsCount = activePlateItems.reduce((acc, it) => acc + it.count, 0);

    return (
      <div className="space-y-4 w-full animate-in fade-in duration-300">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 max-w-[390px] mx-auto z-50 bg-[#16381E] text-[#FAF8F2] p-3.5 rounded-xl border border-[#3E7B4C] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* CARD 1: 3D Thali Simulation & Nutrition */}
        {/* ============================================================= */}
        <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
          {/* Card Header: Title & Thali/Plate Toggle */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2D5A38]/50 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-[#FAF8F2] tracking-wide truncate">
                3D Plate Simulation
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Thali / Ceramic Plate pill toggle */}
              <div className="flex bg-[#0E2412] rounded-lg p-0.5 border border-[#2D5A38] text-[11px]">
                <button
                  type="button"
                  onClick={() => setPlateVariant("thali")}
                  id="student-variant-thali-btn"
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    plateVariant === "thali"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-[#A3B899] hover:text-[#FAF8F2]"
                  }`}
                >
                  Thali
                </button>
                <button
                  type="button"
                  onClick={() => setPlateVariant("plate")}
                  id="student-variant-plate-btn"
                  className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    plateVariant === "plate"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-[#A3B899] hover:text-[#FAF8F2]"
                  }`}
                >
                  Plate
                </button>
              </div>

              {/* Clear Plate Button */}
              <button
                type="button"
                onClick={handleResetPlate}
                disabled={activePlateItems.length === 0}
                id="student-reset-plate-btn"
                className="p-1 rounded-lg bg-[#0E2412] border border-[#2D5A38] text-[#A3B899] hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Clear all items from plate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Items Chips Bar (clean, outside the 3D canvas) */}
          {activePlateItems.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#A3B899]">
                <span className="font-medium text-[#FAF8F2]">
                  On your plate ({totalPlateItemsCount} items):
                </span>
                <span className="text-[10px] text-[#5A7A60]">Tap × to remove</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {activePlateItems.map((it) => (
                  <div
                    key={it.food_id}
                    className="shrink-0 px-2.5 py-1 rounded-xl bg-[#0E2412] border border-[#2D5A38] text-xs font-medium text-[#FAF8F2] flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{it.name}</span>
                    <span className="text-[#D4AF37] font-mono font-bold">×{it.count}</span>
                    <button
                      type="button"
                      onClick={() => handleItemCountChange(it.food_id, -1)}
                      className="text-[#A3B899] hover:text-red-400 font-bold ml-0.5 cursor-pointer leading-none"
                      title={`Remove one ${it.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#A3B899] italic bg-[#0E2412]/50 px-3 py-2 rounded-xl border border-[#2D5A38]/30 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Your plate is empty. Add food from the palette below!</span>
            </div>
          )}

          {/* 3D Canvas Box (clean, full width, perfect 270px aspect ratio) */}
          <div className="h-[270px] w-full rounded-2xl bg-[#0E2412]/90 border border-[#2D5A38]/60 overflow-hidden relative shadow-inner">
            <Plate3DCanvas
              items={activePlateItems}
              variant={plateVariant}
              saveSuccessBurst={saveSuccessBurst}
              showOverlayBadges={false}
            />
          </div>

          {/* Real-time Nutrition Summary Strip */}
          <div className="p-3.5 rounded-xl bg-[#0E2412] border border-[#2D5A38] space-y-3">
            {/* Unverified items alert */}
            {unverifiedItemsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span>Includes {unverifiedItemsCount} unverified item{unverifiedItemsCount > 1 ? "s" : ""}</span>
              </div>
            )}

            {/* Primary Kcal Metric */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold text-[#D4AF37]">
                    <AnimatedNumber value={totals.kcal} />
                  </span>
                  <span className="text-xs text-[#A3B899]">kcal</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      totals.descriptor === "Light"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : totals.descriptor === "Moderate"
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {totals.descriptor}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium mt-0.5 leading-snug">
                  {totals.hint}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-[#FAF8F2]">₹{totals.cost}</div>
                  <div className="text-[9px] text-[#A3B899]">prep cost</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-emerald-300">{totals.co2e}g</div>
                  <div className="text-[9px] text-[#A3B899]">CO2e</div>
                </div>
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2D5A38]/50 text-xs">
              <div className="p-1.5 rounded-xl bg-[#16381E] border border-[#2D5A38] text-center min-w-0">
                <span className="text-[10px] text-[#A3B899] uppercase tracking-wider block truncate">Protein</span>
                <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                  {totals.protein}g
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-[#16381E] border border-[#2D5A38] text-center min-w-0">
                <span className="text-[10px] text-[#A3B899] uppercase tracking-wider block truncate">Carbs</span>
                <div className="font-mono font-bold text-amber-300 text-xs mt-0.5">
                  {totals.carbs}g
                </div>
              </div>
              <div className="p-1.5 rounded-xl bg-[#16381E] border border-[#2D5A38] text-center min-w-0">
                <span className="text-[10px] text-[#A3B899] uppercase tracking-wider block truncate">Fat</span>
                <div className="font-mono font-bold text-orange-400 text-xs mt-0.5">
                  {totals.fat}g
                </div>
              </div>
            </div>

            {/* Expandable Calorie Thresholds */}
            <div>
              <button
                type="button"
                onClick={() => setShowThresholdSliders(!showThresholdSliders)}
                className="text-[10px] text-[#A3B899] hover:text-[#D4AF37] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>
                  {showThresholdSliders
                    ? "Hide calorie thresholds"
                    : "Adjust Light / Moderate / Hearty thresholds"}
                </span>
              </button>

              {showThresholdSliders && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#16381E] border border-[#2D5A38] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A3B899]">Light Cutoff:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      &lt; {lightThreshold} kcal
                    </span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="600"
                    step="25"
                    value={lightThreshold}
                    onChange={(e) => setLightThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-[#A3B899]">Hearty Cutoff:</span>
                    <span className="font-mono font-bold text-amber-300">
                      &gt; {moderateThreshold} kcal
                    </span>
                  </div>
                  <input
                    type="range"
                    min="650"
                    max="1200"
                    step="25"
                    value={moderateThreshold}
                    onChange={(e) => setModerateThreshold(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Non-Medical Disclaimer */}
            <p className="text-[9px] text-[#5A7A60] italic pt-1 border-t border-[#2D5A38]/30">
              General institutional recipe approximations. Not clinical or medical dietary advice.
            </p>
          </div>
        </div>

        {/* ============================================================= */}
        {/* CARD 2: Add Food to Plate (Catalog Palette) */}
        {/* ============================================================= */}
        <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-3 sm:p-4 shadow-lg space-y-3">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#2D5A38]/50 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <UtensilsCrossed className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-[#FAF8F2] tracking-wide truncate">
                Add Food to Plate
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#D4AF37] bg-[#0E2412] px-2 py-0.5 rounded-full border border-[#2D5A38] shrink-0">
              {totalPlateItemsCount} on plate
            </span>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#D4AF37] text-[#0E2412] border-[#D4AF37]"
                      : "bg-[#0E2412] text-[#A3B899] border-[#2D5A38] hover:border-[#3E7B4C]"
                  }`}
                >
                  {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Search input if foods > 6 */}
          {foods.length > 6 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter dishes (e.g. roti, dal, rice)..."
                className="w-full bg-[#0E2412] border border-[#2D5A38] rounded-xl px-3 py-1.5 text-xs text-[#FAF8F2] placeholder-[#5A7A60] focus:outline-none focus:border-[#D4AF37]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A3B899] hover:text-[#FAF8F2]"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Food Items List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
            {filteredFoods.map((food) => {
              const count = selectedItems[food.id] || 0;
              const isSelected = count > 0;

              return (
                <div
                  key={food.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-[#1B4D2E]/60 border-emerald-500/50 shadow-sm"
                      : "bg-[#0E2412] border-[#2D5A38] hover:border-[#3E7B4C]"
                  }`}
                >
                  {/* Left: Dish Icon & Info */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-[#16381E] border border-[#2D5A38] flex items-center justify-center shrink-0">
                      <FoodIcon dishId={food.icon_id || food.id} name={food.name} size="sm" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            food.veg ? "bg-emerald-400" : "bg-red-400"
                          }`}
                          title={food.veg ? "Vegetarian" : "Non-Veg"}
                        />
                        <span className="text-xs font-bold text-[#FAF8F2] truncate block">
                          {food.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#A3B899] flex items-center gap-1 mt-0.5">
                        <span className="text-[#D4AF37] font-semibold">
                          {Math.round(food.kcal_per_unit)} kcal
                        </span>
                        <span>&bull;</span>
                        <span>₹{food.cost_inr_per_unit}</span>
                        {food.unit_label && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[10px] text-[#5A7A60] truncate max-w-[70px]">
                              {food.unit_label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Tactile Stepper Control (Clean 32px targets with no clipping) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleItemCountChange(food.id, -1)}
                      disabled={count === 0}
                      aria-label={`Remove one ${food.name}`}
                      className="w-8 h-8 rounded-lg bg-[#0E2412] border border-[#2D5A38] flex items-center justify-center text-[#FAF8F2] hover:bg-[#16381E] disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={`w-5 text-center font-mono font-bold text-xs ${
                        isSelected ? "text-[#D4AF37]" : "text-[#A3B899]"
                      }`}
                    >
                      {count}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleItemCountChange(food.id, 1)}
                      aria-label={`Add one ${food.name}`}
                      className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredFoods.length === 0 && (
              <div className="text-center py-6 text-xs text-[#A3B899]">
                No dishes match your filter.
              </div>
            )}
          </div>
        </div>

        {/* ============================================================= */}
        {/* CARD 3: Save Plate as Pre-Order Signal */}
        {/* ============================================================= */}
        <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#2D5A38]/50">
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-bold text-[#FAF8F2] tracking-wide">
              Save Plate as Pre-Order Signal
            </h3>
          </div>

          <p className="text-xs text-[#A3B899] leading-relaxed">
            Saves your meal intention to inform cafeteria batch cooking and eliminate waste.
          </p>

          <form onSubmit={handleSavePlate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-1">
                Plate Name
              </label>
              <input
                type="text"
                required
                value={plateName}
                onChange={(e) => setPlateName(e.target.value)}
                className="w-full min-h-[44px] bg-[#0E2412] border border-[#2D5A38] rounded-xl px-3.5 text-xs text-[#FAF8F2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-1">
                  Service Shift
                </label>
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  className="w-full min-h-[44px] bg-[#0E2412] border border-[#2D5A38] rounded-xl px-3 text-xs text-[#FAF8F2] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSharePlate}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-[#0E2412] border border-[#2D5A38] text-xs font-semibold text-[#D4AF37] hover:bg-[#1B4D2E] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || activePlateItems.length === 0}
              id="student-save-plate-btn"
              className="w-full min-h-[46px] py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5BF48] text-[#0E2412] font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Pre-Order..." : "Save Pre-Order Signal"}</span>
            </button>
          </form>
        </div>

        {/* ============================================================= */}
        {/* CARD 4: Popular Campus Plates Shelf */}
        {/* ============================================================= */}
        {popularPlates.length > 0 && (
          <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D5A38]/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-[#FAF8F2] tracking-wide">
                  Popular Campus Plates
                </h3>
              </div>
              <span className="text-[10px] text-[#A3B899]">Chef Presets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {popularPlates.map((pop) => (
                <div
                  key={pop.id}
                  className="p-3 rounded-xl bg-[#0E2412] border border-[#2D5A38] flex flex-col justify-between gap-2.5 hover:border-[#3E7B4C] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FAF8F2] truncate">
                        {pop.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
                        {pop.total_kcal} kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#A3B899] mt-0.5">
                      <span>{pop.items?.length || 0} items</span>
                      <span>&bull;</span>
                      <span>{pop.is_veg ? "Veg 🥦" : "Non-Veg 🍗"}</span>
                      <span>&bull;</span>
                      <span className="text-[#D4AF37] font-mono">₹{pop.total_cost_inr}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLoadPopularPlate(pop)}
                    className="w-full min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-bold bg-[#1B4D2E] hover:bg-[#2D5A38] text-[#FAF8F2] border border-[#3E7B4C] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Load Onto Plate</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

      {/* Main Studio Workspace: Split 3D Canvas & Builder Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Plate Display & Live Totals Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-3 sm:p-5 shadow-lg relative flex flex-col justify-between overflow-hidden">
            {/* Top Bar on Canvas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-500/15 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h2 className="text-sm sm:text-base font-serif font-bold text-[#f5eedc]">
                    3D Plate Simulation
                  </h2>
                </div>
                <button
                  onClick={handleResetPlate}
                  className="sm:hidden p-1.5 rounded-lg text-[#f5eedc]/60 hover:text-[#f5eedc] hover:bg-white/5 transition-colors"
                  title="Clear plate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="flex bg-[#121f12] rounded-lg p-0.5 border border-emerald-500/20 text-xs w-full sm:w-auto">
                  <button
                    onClick={() => setPlateVariant("thali")}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded font-medium text-xs transition-all text-center ${
                      plateVariant === "thali"
                        ? "bg-emerald-600 text-white shadow-sm font-semibold"
                        : "text-[#f5eedc]/70 hover:text-white"
                    }`}
                  >
                    Stainless Thali
                  </button>
                  <button
                    onClick={() => setPlateVariant("plate")}
                    className={`flex-1 sm:flex-initial px-3 py-1 rounded font-medium text-xs transition-all text-center ${
                      plateVariant === "plate"
                        ? "bg-emerald-600 text-white shadow-sm font-semibold"
                        : "text-[#f5eedc]/70 hover:text-white"
                    }`}
                  >
                    Ceramic Plate
                  </button>
                </div>

                <button
                  onClick={handleResetPlate}
                  className="hidden sm:inline-flex p-1.5 rounded-lg text-[#f5eedc]/60 hover:text-[#f5eedc] hover:bg-white/5 transition-colors"
                  title="Clear plate"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="h-[240px] sm:h-[340px] w-full">
              <Plate3DCanvas
                items={activePlateItems}
                variant={plateVariant}
                saveSuccessBurst={saveSuccessBurst}
              />
            </div>

            {/* Live Totals Card */}
            <div className="p-4 rounded-xl bg-[#121f12] border border-emerald-500/25 mt-2 space-y-3">
              {/* Unverified Items Warning */}
              {unverifiedItemsCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <span>Includes {unverifiedItemsCount} unverified item{unverifiedItemsCount > 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-bold text-emerald-300">
                      <AnimatedNumber value={totals.kcal} />
                    </span>
                    <span className="text-xs text-[#f5eedc]/70">kcal</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        totals.descriptor === "Light"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : totals.descriptor === "Moderate"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {totals.descriptor}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400/90 font-medium mt-1">{totals.hint}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-300">₹{totals.cost}</div>
                    <div className="text-[10px] text-[#f5eedc]/50">prep cost</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-200">{totals.co2e}g</div>
                    <div className="text-[10px] text-[#f5eedc]/50">CO2e</div>
                  </div>
                </div>
              </div>

              {/* Macros Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/15 text-xs">
                <div className="p-2 rounded-lg bg-[#0e190e] border border-emerald-500/15">
                  <span className="text-[10px] text-[#f5eedc]/60">Protein</span>
                  <div className="font-mono font-bold text-emerald-300 mt-0.5">
                    {totals.protein}g
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0e190e] border border-emerald-500/15">
                  <span className="text-[10px] text-[#f5eedc]/60">Carbs</span>
                  <div className="font-mono font-bold text-amber-200 mt-0.5">
                    {totals.carbs}g
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#0e190e] border border-emerald-500/15">
                  <span className="text-[10px] text-[#f5eedc]/60">Fat</span>
                  <div className="font-mono font-bold text-orange-300 mt-0.5">{totals.fat}g</div>
                </div>
              </div>

              {/* Threshold Adjuster Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowThresholdSliders(!showThresholdSliders)}
                  className="text-[11px] text-[#f5eedc]/60 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Sliders className="w-3 h-3" />
                  <span>
                    {showThresholdSliders
                      ? "Hide descriptor thresholds"
                      : "Adjust Light / Moderate / Hearty thresholds"}
                  </span>
                </button>

                {showThresholdSliders && (
                  <div className="mt-2.5 p-3 rounded-lg bg-[#0d170d] border border-emerald-500/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#f5eedc]/70">Light Cutoff:</span>
                      <span className="font-mono font-bold text-emerald-300">
                        &lt; {lightThreshold} kcal
                      </span>
                    </div>
                    <input
                      type="range"
                      min="300"
                      max="600"
                      step="25"
                      value={lightThreshold}
                      onChange={(e) => setLightThreshold(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#f5eedc]/70">Hearty Cutoff:</span>
                      <span className="font-mono font-bold text-amber-300">
                        &gt; {moderateThreshold} kcal
                      </span>
                    </div>
                    <input
                      type="range"
                      min="650"
                      max="1200"
                      step="25"
                      value={moderateThreshold}
                      onChange={(e) => setModerateThreshold(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Mandatory Non-Medical Disclaimer */}
              <p className="text-[10px] text-[#f5eedc]/50 italic pt-1 border-t border-emerald-500/10">
                General information, not medical or dietary advice. Serving estimates reflect institutional recipe standards.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Food Palette & Save Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Food Palette */}
          <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-5 shadow-lg flex flex-col max-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/15">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-serif font-bold text-[#f5eedc]">Catalog Palette</h3>
              </div>
              <span className="text-[11px] text-[#f5eedc]/60">
                {activePlateItems.reduce((acc, it) => acc + it.count, 0)} items on plate
              </span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-emerald-500/10 pr-1 mt-2">
              {foods.map((food) => {
                const count = selectedItems[food.id] || 0;
                return (
                  <div
                    key={food.id}
                    className="py-2.5 flex items-center justify-between hover:bg-emerald-500/5 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FoodIcon dishId={food.icon_id || food.id} size="sm" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-[#f5eedc] truncate">
                          {food.name}
                        </div>
                        <div className="text-[10px] text-[#f5eedc]/60 flex items-center gap-1.5 font-mono">
                          <span>{Math.round(food.kcal_per_unit)} kcal</span>
                          <span>&middot;</span>
                          <span>₹{food.cost_inr_per_unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleItemCountChange(food.id, -1)}
                        disabled={count === 0}
                        aria-label={`Remove one ${food.name}`}
                        className="w-7 h-7 rounded-lg bg-[#121f12] border border-emerald-500/20 flex items-center justify-center text-[#f5eedc] hover:bg-emerald-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center font-mono font-bold text-xs text-emerald-300">
                        {count}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleItemCountChange(food.id, 1)}
                        aria-label={`Add one ${food.name}`}
                        className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Plate as Pre-Order Form */}
          <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-serif font-bold text-[#f5eedc] flex items-center gap-2">
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Save Plate as Pre-Order Signal</span>
            </h3>

            <p className="text-xs text-[#f5eedc]/70">
              Saving your plate sends an aggregate demand signal to kitchen production, helping
              cook sheets calibrate portion allocations.
            </p>

            <form onSubmit={handleSavePlate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#f5eedc]/70 mb-1">Plate Name</label>
                <input
                  type="text"
                  required
                  value={plateName}
                  onChange={(e) => setPlateName(e.target.value)}
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-1.5 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#f5eedc]/70 mb-1">Service Shift</label>
                  <select
                    value={selectedMeal}
                    onChange={(e) => setSelectedMeal(e.target.value)}
                    className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-[#f5eedc] focus:outline-none"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSharePlate}
                    className="w-full py-1.5 px-3 rounded-xl border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share Card
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving || activePlateItems.length === 0}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving Pre-Order..." : "Save Plate"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Popular Plates Shelf */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-serif font-bold text-[#f5eedc]">Popular Campus Plates</h3>
          </div>
          <span className="text-xs text-[#f5eedc]/60">Click any preset to load onto 3D plate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {popularPlates.map((pop) => (
            <div
              key={pop.id}
              className="p-3.5 rounded-xl bg-[#121f12] border border-emerald-500/15 flex flex-col justify-between gap-3 hover:border-emerald-500/30 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200 truncate">{pop.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {pop.total_kcal} kcal
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-[#f5eedc]/60 mt-1">
                  <span>{pop.items?.length || 0} items</span>
                  <span>&middot;</span>
                  <span>{pop.is_veg ? "Veg" : "Non-Veg"}</span>
                  <span>&middot;</span>
                  <span className="text-emerald-300 font-mono">₹{pop.total_cost_inr}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
                <button
                  type="button"
                  onClick={() => handleLoadPopularPlate(pop)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600/80 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Load Onto Plate
                </button>

                {!pop.is_popular_seed && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedPlate(pop.id)}
                    aria-label={`Delete custom plate ${pop.name}`}
                    className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Delete plate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
