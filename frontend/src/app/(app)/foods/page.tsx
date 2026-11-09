"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  BookOpen,
  Filter,
  ShieldCheck,
  Scale,
  Sparkles,
} from "lucide-react";
import { demoApi } from "@/lib/api";
import FoodIcon from "@/components/FoodIcon";
import FoodDrawer, { FoodItemData } from "@/components/foods/FoodDrawer";
import FoodCsvImportModal from "@/components/foods/FoodCsvImportModal";
import IngredientLibraryModal from "@/components/foods/IngredientLibraryModal";
import ErrorStateCard from "@/components/shell/ErrorStateCard";
import { formatINR } from "@/lib/formatters";

export default function FoodsPage() {
  const [foods, setFoods] = useState<FoodItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItemData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await demoApi.getFoods();
      setFoods(res.foods || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load institutional foods catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories = useMemo(() => {
    const set = new Set(foods.map((f) => f.category));
    return Array.from(set);
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase()) ||
        (f.note && f.note.toLowerCase().includes(search.toLowerCase())) ||
        (f.source_note && f.source_note.toLowerCase().includes(search.toLowerCase()));

      let matchesFilter = true;
      if (selectedFilter === "needs_verification") {
        matchesFilter = !f.verified;
      } else if (selectedFilter === "verified") {
        matchesFilter = !!f.verified;
      } else if (selectedFilter === "veg") {
        matchesFilter = f.veg;
      } else if (selectedFilter === "non_veg") {
        matchesFilter = !f.veg;
      } else if (selectedFilter !== "all") {
        matchesFilter = f.category === selectedFilter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [foods, search, selectedFilter]);

  const handleSaveFood = async (foodData: FoodItemData) => {
    if (foodData.id) {
      await demoApi.updateFood(foodData.id, foodData);
      showToast(`Updated "${foodData.name}" calories & nutritional profile.`);
    } else {
      await demoApi.createFood(foodData);
      showToast(`Added "${foodData.name}" to institutional catalog.`);
    }
    await fetchFoods();
  };

  const handleDeleteFood = async (foodId: string) => {
    await demoApi.deleteFood(foodId);
    showToast("Food item removed from catalog.");
    await fetchFoods();
  };

  const handleEditClick = (food: FoodItemData) => {
    setEditingFood(food);
    setIsDrawerOpen(true);
  };

  const handleAddNew = () => {
    setEditingFood(null);
    setIsDrawerOpen(true);
  };

  const handleExportCsv = () => {
    window.location.href = "/api/v1/demo/foods/export";
    showToast("Exporting sanitized CSV with formula injection neutralization...");
  };

  const verifiedCount = foods.filter((f) => f.verified).length;
  const unverifiedCount = foods.length - verifiedCount;

  // Source Badge renderer
  const renderSourceBadge = (sourceType?: string) => {
    switch (sourceType) {
      case "label":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Label
          </span>
        );
      case "recipe":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Recipe
          </span>
        );
      case "measured":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Measured
          </span>
        );
      case "reference":
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Reference
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400 flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Real Data System & Food Catalog</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#f5eedc]">
              Foods & Nutritional Calibrator
            </h1>
            <p className="text-sm text-[#f5eedc]/70 mt-2 leading-relaxed">
              Unified institutional database with verified weighing scales, batch recipe calculators,
              strict Pydantic CSV import/export, and source tracking (
              <span className="text-blue-300 font-semibold">Label</span>,{" "}
              <span className="text-purple-300 font-semibold">Recipe</span>,{" "}
              <span className="text-emerald-300 font-semibold">Measured</span>,{" "}
              <span className="text-amber-300 font-semibold">Reference</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsIngredientModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#faf8f2] text-xs font-semibold border border-white/10 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Ingredient Library</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 rounded-xl bg-[#111c11] hover:bg-[#1a2d1a] border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleAddNew}
              className="px-4 py-2.5 rounded-xl bg-forest-950 hover:bg-forest-900 border border-emerald-400/30 text-[#FAF8F2] text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-500/15">
          <div className="p-3 rounded-xl bg-[#121f12] border border-emerald-500/15">
            <div className="text-[11px] text-[#f5eedc]/60">Total Catalog Items</div>
            <div className="text-xl font-mono font-bold text-emerald-300 mt-0.5">{foods.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#121f12] border border-emerald-500/15">
            <div className="text-[11px] text-[#f5eedc]/60">Kitchen-Verified</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span>{verifiedCount}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#121f12] border border-emerald-500/15">
            <div className="text-[11px] text-[#f5eedc]/60">Needs Verification</div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
              <span>{unverifiedCount}</span>
              <span className="text-[11px] text-amber-300/80 font-normal">pending</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#121f12] border border-emerald-500/15">
            <div className="text-[11px] text-[#f5eedc]/60">Kenney 3D Models</div>
            <div className="text-xl font-mono font-bold text-emerald-200 mt-0.5">201 models</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#152315] p-3 rounded-xl border border-emerald-500/20">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish name, category, note..."
            className="w-full bg-[#101b10] border border-emerald-500/25 rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#f5eedc] placeholder-[#f5eedc]/40 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-[#101b10] text-[#f5eedc]/70 hover:text-white border border-emerald-500/15"
            }`}
          >
            All Items
          </button>

          <button
            onClick={() => setSelectedFilter("needs_verification")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedFilter === "needs_verification"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-500/10 text-amber-300 hover:text-white border border-amber-500/30"
            }`}
          >
            <span>Needs Verification</span>
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-[10px] flex items-center justify-center">
              {unverifiedCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter("verified")}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === "verified"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-[#101b10] text-[#f5eedc]/70 hover:text-white border border-emerald-500/15"
            }`}
          >
            Verified ({verifiedCount})
          </button>

          <button
            onClick={() => setSelectedFilter("veg")}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedFilter === "veg"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-[#101b10] text-[#f5eedc]/70 hover:text-white border border-emerald-500/15"
            }`}
          >
            Veg Only
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                selectedFilter === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#101b10] text-[#f5eedc]/70 hover:text-white border border-emerald-500/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-md">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#f5eedc]/60">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading institutional catalog...
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorStateCard
              title="Failed to Load Foods Catalog"
              message={error}
              onRetry={fetchFoods}
            />
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#f5eedc]/60">
            No dishes match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#f5eedc]">
              <thead className="bg-[#132013] text-[#f5eedc]/60 uppercase tracking-wider text-[10px] border-b border-emerald-500/20">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Source & Verification</th>
                  <th className="py-3 px-4 font-mono">Portion Weight</th>
                  <th className="py-3 px-4 font-mono">Calories</th>
                  <th className="py-3 px-4 font-mono">Macros (P / C / F)</th>
                  <th className="py-3 px-4 font-mono">Cost / Serving</th>
                  <th className="py-3 px-4">3D Asset</th>
                  <th className="py-3 px-4 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {filteredFoods.map((f) => {
                  const swG = f.serving_weight_g ?? (f.serving_weight_kg ? Math.round(f.serving_weight_kg * 1000) : 150);
                  const kc = f.kcal_per_serving ?? f.kcal_per_unit ?? 150;
                  const cost = f.cost_inr_per_serving ?? f.cost_inr_per_unit ?? 10;

                  return (
                    <tr
                      key={f.id || f.name}
                      className="hover:bg-emerald-500/5 transition-colors group cursor-pointer"
                      onClick={() => handleEditClick(f)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <FoodIcon dishId={f.icon_id || f.id || "roti"} size="sm" />
                          <div>
                            <div className="font-semibold text-emerald-200 group-hover:text-emerald-300 flex items-center gap-1.5">
                              <span>{f.name}</span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  f.veg ? "bg-emerald-400" : "bg-amber-400"
                                }`}
                                title={f.veg ? "Vegetarian" : "Non-Vegetarian"}
                              />
                            </div>
                            <div className="text-[10px] text-[#f5eedc]/60 capitalize">
                              {f.category} • {f.unit_label || f.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {renderSourceBadge(f.source_type)}
                          {f.verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400">
                              Unverified
                            </span>
                          )}
                        </div>
                        {f.source_note && (
                          <div className="text-[10px] text-[#8fa896] truncate max-w-[160px] mt-0.5" title={f.source_note}>
                            {f.source_note}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-300">
                        {swG}g
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#faf8f2]">
                        {kc} kcal
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#8fa896]">
                        <span className="text-blue-300">{f.protein_g ?? 0}g P</span> /{" "}
                        <span className="text-amber-300">{f.carbs_g ?? 0}g C</span> /{" "}
                        <span className="text-rose-300">{f.fat_g ?? 0}g F</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-300">
                        {formatINR(cost, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                      </td>

                      <td className="py-3 px-4 text-[#f5eedc]/70 text-[11px]">
                        {f.model_id ? (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] text-emerald-300">
                            {f.model_id}.glb
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8fa896]">procedural</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-emerald-400 font-semibold group-hover:underline">
                          Edit
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Food Drawer */}
      <FoodDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialFood={editingFood}
        onSave={handleSaveFood}
        onDelete={handleDeleteFood}
        onOpenIngredients={() => setIsIngredientModalOpen(true)}
      />

      {/* CSV Import Modal */}
      <FoodCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          showToast("Foods CSV successfully imported and saved!");
          fetchFoods();
        }}
      />

      {/* Ingredient Library Modal */}
      <IngredientLibraryModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        onIngredientsChange={fetchFoods}
      />
    </div>
  );
}
