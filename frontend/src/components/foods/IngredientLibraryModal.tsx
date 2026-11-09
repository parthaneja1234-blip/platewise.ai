"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, BookOpen, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { demoApi } from "@/lib/api";

export interface IngredientItem {
  id: string;
  name: string;
  kcal_per_100g: number;
  protein: number;
  carbs: number;
  fat: number;
  source_note?: string;
}

interface IngredientLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientsChange?: () => void;
}

export default function IngredientLibraryModal({
  isOpen,
  onClose,
  onIngredientsChange,
}: IngredientLibraryModalProps) {
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Ingredient Form state
  const [name, setName] = useState("");
  const [kcal100g, setKcal100g] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await demoApi.getIngredients();
      setIngredients(res.ingredients || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load ingredients library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
      setFormError(null);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Ingredient name is required.");
      return;
    }

    const kc = parseFloat(kcal100g);
    if (isNaN(kc) || kc < 0 || kc > 1000) {
      setFormError("Calories per 100g must be between 0 and 1000 kcal.");
      return;
    }

    const p = protein ? parseFloat(protein) : 0;
    const c = carbs ? parseFloat(carbs) : 0;
    const f = fat ? parseFloat(fat) : 0;

    try {
      setIsSubmitting(true);
      await demoApi.createIngredient({
        name: trimmedName,
        kcal_per_100g: kc,
        protein: isNaN(p) ? 0 : p,
        carbs: isNaN(c) ? 0 : c,
        fat: isNaN(f) ? 0 : f,
        source_note: sourceNote.trim() || undefined,
      });

      // Reset form
      setName("");
      setKcal100g("");
      setProtein("");
      setCarbs("");
      setFat("");
      setSourceNote("");
      showToast(`Added "${trimmedName}" to verified ingredient library.`);
      await fetchIngredients();
      onIngredientsChange?.();
    } catch (err: any) {
      setFormError(err?.message || "Failed to create ingredient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, ingName: string) => {
    try {
      await demoApi.deleteIngredient(id);
      showToast(`Deleted "${ingName}".`);
      await fetchIngredients();
      onIngredientsChange?.();
    } catch (err: any) {
      showToast(err?.message || "Failed to delete ingredient.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#142314] border border-emerald-500/25 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-[#111c11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#faf8f2]">
                Culinary Ingredient Library
              </h2>
              <p className="text-[11px] text-[#8fa896]">
                Editable database for standardized batch recipe composition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8fa896] hover:text-[#faf8f2] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Ground Truth Banner */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-100">Zero Invented Values Guarantee: </span>
            This library is seeded <strong>empty</strong>. Only add raw commodities whose nutritional
            data is verified through certified packaging labels, institutional lab testing, or the{" "}
            <strong>ICMR-NIN Indian Food Composition Tables (IFCT 2017)</strong>.
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#e5dccb]">
          {/* Add Ingredient Form */}
          <form
            onSubmit={handleAddIngredient}
            className="p-4 rounded-xl bg-[#192b19] border border-emerald-500/20 space-y-3"
          >
            <div className="font-semibold text-emerald-300 text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Verified Raw Ingredient</span>
            </div>

            {formError && (
              <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Toor Dal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  kcal / 100g *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1000"
                  required
                  placeholder="335"
                  value={kcal100g}
                  onChange={(e) => setKcal100g(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="22.3"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="57.6"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="1.7"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[10px] text-[#8fa896] uppercase mb-1">
                  Source Note / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. IFCT 2017 entry B012 / Producer Supplier spec sheet"
                  value={sourceNote}
                  onChange={(e) => setSourceNote(e.target.value)}
                  className="w-full bg-[#111c11] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-[#faf8f2] focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Adding..." : "Add to Library"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing Ingredients Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-emerald-300">
                Registered Ingredients ({ingredients.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[#8fa896]">
                Loading ingredient database...
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-300 text-center">
                {error}
              </div>
            ) : ingredients.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#111c11] border border-dashed border-emerald-500/20 text-center text-[#8fa896]">
                <p className="font-serif text-sm text-[#faf8f2] mb-1">Library is currently empty</p>
                <p className="text-[11px]">
                  Add verified ingredients above to use them in the Recipe Calculator drawer.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 overflow-hidden bg-[#111c11]">
                <table className="w-full text-left">
                  <thead className="bg-[#182818] text-[#8fa896] uppercase tracking-wider text-[10px] border-b border-emerald-500/20">
                    <tr>
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3 font-mono">kcal/100g</th>
                      <th className="py-2.5 px-3 font-mono">Protein</th>
                      <th className="py-2.5 px-3 font-mono">Carbs</th>
                      <th className="py-2.5 px-3 font-mono">Fat</th>
                      <th className="py-2.5 px-3">Source Note</th>
                      <th className="py-2.5 px-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10">
                    {ingredients.map((ing) => (
                      <tr key={ing.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-medium text-[#faf8f2]">{ing.name}</td>
                        <td className="py-2 px-3 font-mono text-emerald-300">{ing.kcal_per_100g}</td>
                        <td className="py-2 px-3 font-mono text-blue-300">{ing.protein}g</td>
                        <td className="py-2 px-3 font-mono text-amber-300">{ing.carbs}g</td>
                        <td className="py-2 px-3 font-mono text-rose-300">{ing.fat}g</td>
                        <td className="py-2 px-3 text-[#8fa896] truncate max-w-[200px]" title={ing.source_note}>
                          {ing.source_note || "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(ing.id, ing.name)}
                            className="p-1 rounded text-[#8fa896] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-emerald-500/20 bg-[#111c11] flex items-center justify-between text-xs">
          <span className="text-[#8fa896]">
            Ingredients are available globally across recipe batch drawers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#faf8f2] font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
