"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  Trash2,
  Box,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Calculator,
  Plus,
  Scale,
  ShieldCheck,
  Info,
} from "lucide-react";
import AssetPickerModal from "./AssetPickerModal";
import FoodIcon from "@/components/FoodIcon";
import { demoApi } from "@/lib/api";

export interface FoodItemData {
  id?: string;
  name: string;
  category: string;
  veg: boolean;
  unit: string;
  unit_label?: string;
  serving_weight_g?: number;
  kcal_per_100g?: number | null;
  kcal_per_serving?: number;
  kcal_per_unit: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  cost_inr_per_serving?: number;
  cost_inr_per_unit: number;
  co2e_g_per_unit: number;
  serving_weight_kg: number;
  popularity: number;
  max_per_plate?: number;
  model_id?: string;
  icon_id?: string;
  source_type?: "label" | "recipe" | "measured" | "reference";
  source_note?: string;
  measured_on?: string;
  recipe_data?: any;
  note?: string;
  verified?: boolean;
}

interface FoodDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialFood?: FoodItemData | null;
  onSave: (food: FoodItemData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onOpenIngredients?: () => void;
}

export default function FoodDrawer({
  isOpen,
  onClose,
  initialFood,
  onSave,
  onDelete,
  onOpenIngredients,
}: FoodDrawerProps) {
  const [formData, setFormData] = useState<FoodItemData>({
    name: "",
    category: "curry",
    veg: true,
    unit: "1 bowl (150g)",
    unit_label: "1 bowl",
    serving_weight_g: 150,
    kcal_per_100g: 100,
    kcal_per_serving: 150,
    kcal_per_unit: 150,
    protein_g: 6.0,
    carbs_g: 20.0,
    fat_g: 4.0,
    fiber_g: 2.0,
    cost_inr_per_serving: 12.0,
    cost_inr_per_unit: 12.0,
    co2e_g_per_unit: 100.0,
    serving_weight_kg: 0.15,
    popularity: 0.85,
    max_per_plate: 3,
    model_id: "bowl-soup",
    icon_id: "dal",
    source_type: "reference",
    source_note: "Reference institutional database",
    measured_on: "",
    note: "reference",
    verified: false,
  });

  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recipe Calculator State
  const [recipeCalcOpen, setRecipeCalcOpen] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [batchServings, setBatchServings] = useState<number>(10);
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<{ ingredient_id: string; name: string; grams: number }>
  >([]);

  useEffect(() => {
    if (initialFood) {
      const swG =
        initialFood.serving_weight_g ??
        (initialFood.serving_weight_kg ? Math.round(initialFood.serving_weight_kg * 1000) : 150);
      const kc = initialFood.kcal_per_serving ?? initialFood.kcal_per_unit ?? 150;
      const cost = initialFood.cost_inr_per_serving ?? initialFood.cost_inr_per_unit ?? 10;

      setFormData({
        ...initialFood,
        serving_weight_g: swG,
        kcal_per_serving: kc,
        kcal_per_unit: kc,
        cost_inr_per_serving: cost,
        cost_inr_per_unit: cost,
        protein_g: initialFood.protein_g ?? 0,
        carbs_g: initialFood.carbs_g ?? 0,
        fat_g: initialFood.fat_g ?? 0,
        fiber_g: initialFood.fiber_g ?? 0,
        source_type: initialFood.source_type || "reference",
        verified: initialFood.verified ?? false,
      });

      if (initialFood.recipe_data?.ingredients) {
        setRecipeIngredients(initialFood.recipe_data.ingredients);
        setBatchServings(initialFood.recipe_data.batch_servings || 10);
      }
    } else {
      setFormData({
        name: "",
        category: "curry",
        veg: true,
        unit: "1 bowl (150g)",
        unit_label: "1 bowl",
        serving_weight_g: 150,
        kcal_per_100g: 100,
        kcal_per_serving: 150,
        kcal_per_unit: 150,
        protein_g: 6.0,
        carbs_g: 20.0,
        fat_g: 4.0,
        fiber_g: 2.0,
        cost_inr_per_serving: 12.0,
        cost_inr_per_unit: 12.0,
        co2e_g_per_unit: 100.0,
        serving_weight_kg: 0.15,
        popularity: 0.85,
        max_per_plate: 3,
        model_id: "bowl-soup",
        icon_id: "dal",
        source_type: "reference",
        source_note: "Reference institutional database",
        measured_on: "",
        note: "reference",
        verified: false,
      });
      setRecipeIngredients([]);
      setBatchServings(10);
    }
    setConfirmDelete(false);
    setError(null);
    setRecipeCalcOpen(false);
  }, [initialFood, isOpen]);

  // Load available ingredients for recipe calculator
  useEffect(() => {
    if (recipeCalcOpen) {
      demoApi.getIngredients().then((res) => {
        setAvailableIngredients(res.ingredients || []);
      }).catch(() => {});
    }
  }, [recipeCalcOpen]);

  // Live Cross-Checks Warning evaluation
  const liveWarnings = useMemo(() => {
    const list: string[] = [];
    const sw = formData.serving_weight_g ?? 0;
    const kc = formData.kcal_per_serving ?? formData.kcal_per_unit ?? 0;
    const k100 = formData.kcal_per_100g ?? 0;
    const p = formData.protein_g ?? 0;
    const c = formData.carbs_g ?? 0;
    const f = formData.fat_g ?? 0;

    // 1. Bounds
    if (sw < 5 || sw > 800) {
      list.push(`Serving weight (${sw}g) outside expected 5–800g bounds.`);
    }
    if (kc < 0 || kc > 1500) {
      list.push(`Calories (${kc} kcal) outside expected 0–1500 kcal single serving bounds.`);
    }

    // 2. kcal vs 100g * sw / 100 (> 15%)
    if (k100 > 0 && sw > 0 && kc > 0) {
      const expKcal = (k100 * sw) / 100;
      const diff = Math.abs(kc - expKcal) / Math.max(expKcal, 1);
      if (diff > 0.15) {
        list.push(
          `Serving calories (${kc}) deviates ${Math.round(diff * 100)}% from calculated (${k100} kcal/100g × ${sw}g / 100 = ${Math.round(expKcal)} kcal).`
        );
      }
    }

    // 3. Macro energy sum vs kcal (> 20%)
    const macroEnergy = 4 * p + 4 * c + 9 * f;
    if (macroEnergy > 0 && kc > 0) {
      const diff = Math.abs(kc - macroEnergy) / Math.max(macroEnergy, 1);
      if (diff > 0.2) {
        list.push(
          `Stated calories (${kc}) deviates ${Math.round(diff * 100)}% from macro energy sum (4×P + 4×C + 9×F = ${Math.round(macroEnergy)} kcal).`
        );
      }
    }

    return list;
  }, [formData]);

  // Recipe Calculator Live Calculations
  const recipeCalculation = useMemo(() => {
    if (!recipeIngredients.length || batchServings <= 0) return null;

    let totalGrams = 0;
    let totalKcal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    recipeIngredients.forEach((item) => {
      const ing = availableIngredients.find((a) => a.id === item.ingredient_id);
      if (ing && item.grams > 0) {
        totalGrams += item.grams;
        const factor = item.grams / 100.0;
        totalKcal += ing.kcal_per_100g * factor;
        totalP += ing.protein * factor;
        totalC += ing.carbs * factor;
        totalF += ing.fat * factor;
      }
    });

    return {
      batchGrams: totalGrams,
      batchKcal: Math.round(totalKcal),
      servingWeightG: Math.round(totalGrams / batchServings),
      servingKcal: Math.round(totalKcal / batchServings),
      servingP: Math.round((totalP / batchServings) * 10) / 10,
      servingC: Math.round((totalC / batchServings) * 10) / 10,
      servingF: Math.round((totalF / batchServings) * 10) / 10,
    };
  }, [recipeIngredients, batchServings, availableIngredients]);

  const handleApplyRecipe = () => {
    if (!recipeCalculation) return;

    setFormData((prev) => ({
      ...prev,
      serving_weight_g: recipeCalculation.servingWeightG,
      serving_weight_kg: Number(((recipeCalculation.servingWeightG || 0) / 1000).toFixed(3)),
      kcal_per_serving: recipeCalculation.servingKcal,
      kcal_per_unit: recipeCalculation.servingKcal,
      kcal_per_100g:
        recipeCalculation.servingWeightG > 0
          ? Math.round((recipeCalculation.servingKcal / recipeCalculation.servingWeightG) * 100)
          : prev.kcal_per_100g,
      protein_g: recipeCalculation.servingP,
      carbs_g: recipeCalculation.servingC,
      fat_g: recipeCalculation.servingF,
      source_type: "recipe",
      source_note: `Calculated from ${recipeIngredients.length} ingredients (${batchServings} servings batch)`,
      verified: true,
      recipe_data: {
        batch_servings: batchServings,
        ingredients: recipeIngredients,
      },
    }));

    setRecipeCalcOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please provide a food name.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save food item.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialFood?.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialFood.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to delete food item.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-drawer-title"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
      >
        <div className="bg-[#182818] border-l border-emerald-500/30 w-full max-w-xl h-full flex flex-col shadow-2xl text-[#f5eedc] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-emerald-500/20 flex items-center justify-between bg-[#142314]">
            <div className="flex items-center gap-3">
              <FoodIcon dishId={formData.icon_id || formData.name || "roti"} size="md" />
              <div>
                <h3 id="food-drawer-title" className="text-lg font-serif font-bold text-emerald-300">
                  {initialFood ? "Edit Food & Nutrition" : "Add Food to Catalog"}
                </h3>
                <p className="text-xs text-[#f5eedc]/70">
                  {initialFood?.id ? `ID: ${initialFood.id}` : "Creates persistent catalog entity"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close food drawer"
              className="p-2 rounded-xl text-[#f5eedc]/60 hover:text-[#f5eedc] hover:bg-emerald-500/15 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dal Makhani"
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-3 py-2 text-sm text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                  >
                    <option value="curry">Curry / Dal</option>
                    <option value="rice">Rice / Biryani</option>
                    <option value="bread">Bread / Roti</option>
                    <option value="dry_veg">Dry Vegetable</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="special">Special / Feast</option>
                    <option value="dairy">Dairy / Curd</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                    <option value="side">Side / Salad</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                    Dietary Flag
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, veg: !formData.veg })}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      formData.veg
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                        : "bg-amber-500/20 border-amber-400 text-amber-300"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${formData.veg ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    {formData.veg ? "Vegetarian (Veg)" : "Non-Vegetarian"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                    Serving Unit Label
                  </label>
                  <input
                    type="text"
                    value={formData.unit_label || formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_label: e.target.value,
                        unit: e.target.value,
                      })
                    }
                    placeholder="e.g. 1 bowl, 2 pieces"
                    className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                    Serving Weight (grams) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1500"
                    required
                    value={formData.serving_weight_g ?? 150}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        serving_weight_g: val,
                        serving_weight_kg: Number((val / 1000).toFixed(3)),
                      });
                    }}
                    className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Source Type & Verification Status */}
            <div className="p-3.5 rounded-xl bg-[#121f12] border border-emerald-500/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    Data Source Type
                  </label>
                  <select
                    value={formData.source_type || "reference"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source_type: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#0d170d] border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none capitalize"
                  >
                    <option value="reference">Reference / Estimate</option>
                    <option value="measured">Measured (Scale / Lab)</option>
                    <option value="recipe">Recipe Batch Calculator</option>
                    <option value="label">Packaging Nutrition Label</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    Measured / Verified Date
                  </label>
                  <input
                    type="date"
                    value={formData.measured_on || ""}
                    onChange={(e) => setFormData({ ...formData, measured_on: e.target.value })}
                    className="w-full bg-[#0d170d] border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#f5eedc]/70 mb-1">
                  Source Note / Lab Reference
                </label>
                <input
                  type="text"
                  value={formData.source_note || ""}
                  onChange={(e) => setFormData({ ...formData, source_note: e.target.value })}
                  placeholder="e.g. Weigh scale audit shift #4, IFCT 2017 Table B"
                  className="w-full bg-[#0d170d] border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-[#f5eedc]/90 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="rounded border-emerald-500/30 text-emerald-600 focus:ring-emerald-500 bg-[#0d170d]"
                  />
                  <span className="font-semibold text-emerald-300">
                    Verified Ground Truth (Checked by Kitchen Team)
                  </span>
                </label>

                {formData.verified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Needs Verification
                  </span>
                )}
              </div>
            </div>

            {/* Recipe Calculator Trigger */}
            <div className="p-3 rounded-xl bg-[#152715] border border-emerald-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-[#faf8f2] text-xs">Recipe Batch Calculator</div>
                  <div className="text-[10px] text-[#8fa896]">
                    Compute portion nutrition from raw batch ingredients
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecipeCalcOpen(!recipeCalcOpen)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                {recipeCalcOpen ? "Hide Calculator" : "Open Calculator"}
              </button>
            </div>

            {/* Recipe Calculator Drawer Body */}
            {recipeCalcOpen && (
              <div className="p-4 rounded-xl bg-[#111c11] border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="font-semibold text-emerald-300">Batch Recipe Composition</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#8fa896]">Servings / Batch:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={batchServings}
                      onChange={(e) => setBatchServings(Math.max(1, Number(e.target.value)))}
                      className="w-16 bg-[#0d170d] border border-emerald-500/30 rounded px-2 py-0.5 font-mono text-center text-xs text-[#faf8f2]"
                    />
                  </div>
                </div>

                {/* Ingredients Picker */}
                <div className="space-y-2">
                  {recipeIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#faf8f2] flex-1 truncate">
                        {ing.name}
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="grams"
                        value={ing.grams || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRecipeIngredients((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, grams: val } : item))
                          );
                        }}
                        className="w-24 bg-[#0d170d] border border-emerald-500/30 rounded px-2 py-1 font-mono text-xs text-right text-emerald-300"
                      />
                      <span className="text-[10px] text-[#8fa896]">g</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 rounded text-[#8fa896] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Ingredient Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      id="ingredient-select"
                      className="flex-1 bg-[#0d170d] border border-emerald-500/30 rounded px-2 py-1 text-xs text-[#faf8f2]"
                      defaultValue=""
                      onChange={(e) => {
                        const selId = e.target.value;
                        if (!selId) return;
                        const found = availableIngredients.find((a) => a.id === selId);
                        if (found) {
                          setRecipeIngredients((prev) => [
                            ...prev,
                            { ingredient_id: found.id, name: found.name, grams: 100 },
                          ]);
                        }
                        e.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        + Add ingredient from library...
                      </option>
                      {availableIngredients.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.kcal_per_100g} kcal/100g)
                        </option>
                      ))}
                    </select>

                    {onOpenIngredients && (
                      <button
                        type="button"
                        onClick={onOpenIngredients}
                        className="px-2 py-1 rounded text-[10px] bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap"
                      >
                        Manage Library
                      </button>
                    )}
                  </div>
                </div>

                {/* Calculation Preview */}
                {recipeCalculation && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-2">
                    <div className="font-semibold text-emerald-300 flex items-center justify-between">
                      <span>Calculated per Serving ({recipeCalculation.servingWeightG}g):</span>
                      <span className="font-mono text-emerald-200">
                        {recipeCalculation.servingKcal} kcal
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-[#8fa896]">
                      <div>Protein: {recipeCalculation.servingP}g</div>
                      <div>Carbs: {recipeCalculation.servingC}g</div>
                      <div>Fat: {recipeCalculation.servingF}g</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyRecipe}
                      className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-all cursor-pointer"
                    >
                      Apply Recipe to Dish
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Calories & Macros Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  kcal / serving *
                </label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  required
                  value={formData.kcal_per_serving ?? formData.kcal_per_unit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({
                      ...formData,
                      kcal_per_serving: val,
                      kcal_per_unit: val,
                    });
                  }}
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  kcal / 100g
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.kcal_per_100g ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kcal_per_100g: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-[#f5eedc] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  Cost (₹ / srv)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.cost_inr_per_serving ?? formData.cost_inr_per_unit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({
                      ...formData,
                      cost_inr_per_serving: val,
                      cost_inr_per_unit: val,
                    });
                  }}
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-[#f5eedc] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  Dietary Fiber (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fiber_g ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, fiber_g: Number(e.target.value) })
                  }
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-[#f5eedc] font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Macros row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.protein_g ?? 0}
                  onChange={(e) => setFormData({ ...formData, protein_g: Number(e.target.value) })}
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-blue-300 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.carbs_g ?? 0}
                  onChange={(e) => setFormData({ ...formData, carbs_g: Number(e.target.value) })}
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#f5eedc]/70 uppercase mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fat_g ?? 0}
                  onChange={(e) => setFormData({ ...formData, fat_g: Number(e.target.value) })}
                  className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl px-2.5 py-1.5 text-xs text-rose-300 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Cross-Check Warnings (Live) */}
            {liveWarnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cross-Check Warnings (Validation Flags):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {liveWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Asset Picker Trigger */}
            <div className="p-3.5 rounded-xl bg-[#121f12] border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-300">
                  3D Model & Kenney Icon
                </span>
                <p className="text-[11px] text-[#f5eedc]/60">
                  Model: {formData.model_id || "none"} • Icon: {formData.icon_id || "default"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssetPickerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Choose 3D Asset</span>
              </button>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-5 border-t border-emerald-500/20 bg-[#142314] flex items-center justify-between">
            {initialFood?.id && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-[#f5eedc]/60 hover:text-[#f5eedc]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[#f5eedc]/70 hover:text-[#f5eedc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : initialFood ? "Save Changes" : "Create Food"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AssetPickerModal
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        selectedModelId={formData.model_id}
        selectedIconId={formData.icon_id}
        onSelect={(assets) => {
          setFormData((prev) => ({
            ...prev,
            model_id: assets.modelId,
            icon_id: assets.iconId,
          }));
        }}
      />
    </>
  );
}
