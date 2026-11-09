"use client";

import React, { useState, useMemo } from "react";
import { X, Search, Box, Image as ImageIcon, Check } from "lucide-react";
import FoodIcon from "@/components/FoodIcon";

// List of available 3D models in /public/models (without .glb extension)
export const AVAILABLE_MODELS = [
  "bowl-soup",
  "bowl-cereal",
  "bowl-broth",
  "bowl",
  "bread",
  "cup",
  "cup-tea",
  "cup-coffee",
  "cup-saucer",
  "salad",
  "pudding",
  "rice-ball",
  "pan-stew",
  "pan",
  "pot-stew",
  "pot",
  "skewer-vegetables",
  "egg-cooked",
  "egg-half",
  "egg",
  "pancakes",
  "waffle",
  "croissant",
  "donut",
  "cookie",
  "cake",
  "apple",
  "banana",
  "orange",
  "carrot",
  "broccoli",
  "cauliflower",
  "cabbage",
  "tomato",
  "onion",
  "paprika",
  "radish",
  "mushroom",
  "cucumber",
  "sub",
  "sandwich",
  "taco",
  "pizza",
  "burger",
  "fries",
  "hot-dog",
  "chinese",
  "dim-sum",
  "sushi-egg",
  "sushi-salmon",
  "maki-vegetable",
  "plate-dinner",
  "plate-deep",
  "cutting-board-round",
];

export const AVAILABLE_ICONS = [
  { id: "dal", label: "Dal / Lentils", sample: "dal-tadka" },
  { id: "rice", label: "Rice / Grain", sample: "jeera-rice" },
  { id: "roti", label: "Roti / Flatbread", sample: "roti" },
  { id: "paneer", label: "Paneer / Cottage Cheese", sample: "paneer-butter-masala" },
  { id: "rajma", label: "Rajma / Beans", sample: "rajma" },
  { id: "chole", label: "Chole / Chickpeas", sample: "chole-bhature" },
  { id: "poha", label: "Poha / Flakes", sample: "poha" },
  { id: "idli", label: "Idli / Sambar", sample: "idli-sambar" },
  { id: "biryani", label: "Biryani / Dum Rice", sample: "veg-biryani" },
  { id: "kadhi", label: "Kadhi / Besan", sample: "kadhi-pakora" },
  { id: "curd", label: "Curd / Dahi", sample: "curd" },
  { id: "salad", label: "Fresh Salad", sample: "salad" },
  { id: "sweet", label: "Mithai / Sweet", sample: "gulab-jamun" },
  { id: "chai", label: "Chai / Beverage", sample: "tea" },
  { id: "mixed-veg", label: "Mixed Vegetables", sample: "mixed-veg" },
  { id: "egg", label: "Egg Prep", sample: "egg-curry" },
  { id: "dosa", label: "Dosa / Crepe", sample: "dosa" },
];

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelId?: string;
  selectedIconId?: string;
  onSelect: (assets: { modelId?: string; iconId?: string }) => void;
}

export default function AssetPickerModal({
  isOpen,
  onClose,
  selectedModelId,
  selectedIconId,
  onSelect,
}: AssetPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"models" | "icons">("models");
  const [search, setSearch] = useState("");
  const [tempModel, setTempModel] = useState<string | undefined>(selectedModelId);
  const [tempIcon, setTempIcon] = useState<string | undefined>(selectedIconId);

  const filteredModels = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return AVAILABLE_MODELS;
    return AVAILABLE_MODELS.filter((m) => m.toLowerCase().includes(q));
  }, [search]);

  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return AVAILABLE_ICONS;
    return AVAILABLE_ICONS.filter(
      (i) => i.id.toLowerCase().includes(q) || i.label.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelect({ modelId: tempModel, iconId: tempIcon });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#1c2c1c] border border-emerald-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-[#f5eedc] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-emerald-500/20 flex items-center justify-between bg-[#152315]">
          <div>
            <h3 id="asset-picker-title" className="text-lg font-serif font-bold text-emerald-300">
              Select Food Visual Asset
            </h3>
            <p className="text-xs text-[#f5eedc]/70 mt-0.5">
              Choose a 3D Kenney GLB model or 2D icon sprite for catalog visualization
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close asset picker modal"
            className="p-2 rounded-xl text-[#f5eedc]/60 hover:text-[#f5eedc] hover:bg-emerald-500/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Search Controls */}
        <div className="p-4 border-b border-emerald-500/15 bg-[#182818]/60 flex flex-col sm:flex-row gap-3">
          <div className="flex bg-[#121e12] rounded-xl p-1 border border-emerald-500/20">
            <button
              onClick={() => setActiveTab("models")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "models"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#f5eedc]/70 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D GLB Models ({AVAILABLE_MODELS.length})
            </button>
            <button
              onClick={() => setActiveTab("icons")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "icons"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#f5eedc]/70 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Kenney Icons ({AVAILABLE_ICONS.length})
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === "models" ? "Search 3D models..." : "Search icons..."}
              className="w-full bg-[#121e12] border border-emerald-500/25 rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#f5eedc] placeholder-[#f5eedc]/40 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Asset Grid */}
        <div className="p-4 overflow-y-auto max-h-[50vh] flex-1">
          {activeTab === "models" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredModels.map((m) => {
                const isSelected = tempModel === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTempModel(m)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40"
                        : "bg-[#142314] border-emerald-500/15 text-[#f5eedc]/80 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center mb-2">
                      <Box className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-mono font-medium truncate w-full">{m}</span>
                    <span className="text-[10px] text-emerald-400/70 mt-0.5">.glb asset</span>
                    {isSelected && (
                      <span className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredIcons.map((i) => {
                const isSelected = tempIcon === i.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setTempIcon(i.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40"
                        : "bg-[#142314] border-emerald-500/15 text-[#f5eedc]/80 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    }`}
                  >
                    <FoodIcon dishId={i.sample} size="md" />
                    <div className="overflow-hidden flex-1">
                      <div className="text-xs font-medium truncate">{i.label}</div>
                      <div className="text-[10px] font-mono text-emerald-400/70 truncate">
                        icon_id: {i.id}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-500/20 bg-[#152315] flex items-center justify-between">
          <div className="text-xs text-[#f5eedc]/70">
            Selected: <span className="font-mono text-emerald-300">{tempModel || "none"}</span> (3D) |{" "}
            <span className="font-mono text-emerald-300">{tempIcon || "none"}</span> (icon)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#f5eedc]/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
