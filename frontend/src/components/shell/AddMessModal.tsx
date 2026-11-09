"use client";

import React, { useState } from "react";
import { Building2, X, Plus, Users, MapPin, Clock, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export default function AddMessModal() {
  const { isAddMessOpen, setIsAddMessOpen, addMess } = useAppContext();

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("750");
  const [type, setType] = useState("hostel_mess");
  const [location, setLocation] = useState("");
  const [breakfastTime, setBreakfastTime] = useState("07:30 - 09:30");
  const [lunchTime, setLunchTime] = useState("12:00 - 14:30");
  const [dinnerTime, setDinnerTime] = useState("19:30 - 21:30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddMessOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const capNum = parseInt(capacity, 10);
    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide a valid dining hall name (at least 2 characters).");
      return;
    }
    if (isNaN(capNum) || capNum < 10 || capNum > 10000) {
      setError("Seating capacity must be between 10 and 10,000.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addMess({
        name: name.trim(),
        capacity: capNum,
        type,
        location: location.trim() || "Campus Dining District",
        breakfast_time: breakfastTime,
        lunch_time: lunchTime,
        dinner_time: dinnerTime,
      });
      // Reset form
      setName("");
      setLocation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mess hall");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Dining Hall"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsAddMessOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#142814] text-[#FAF6EE] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-[#0e210e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#faf8f2]">
                Add Dining Hall / Mess
              </h2>
              <p className="text-xs text-[#9ab39a]">
                Register a new cafeteria hall into the demand prediction network
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddMessOpen(false)}
            className="p-1.5 rounded-lg text-[#9ab39a] hover:text-[#FAF6EE] hover:bg-forest-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
              Dining Hall Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Girls Hostel Mess B, South Wing Dining Court"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a180a] border border-amber-500/30 text-sm text-[#FAF6EE] placeholder:text-[#6a8070] focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Seating Capacity *</span>
                </span>
              </label>
              <input
                type="number"
                min="10"
                max="10000"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a180a] border border-amber-500/30 text-sm text-[#FAF6EE] focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                Facility Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a180a] border border-amber-500/30 text-sm text-[#FAF6EE] focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="hostel_mess">Residential Hostel Mess</option>
                <option value="central_court">Central Student Food Court</option>
                <option value="faculty_club">Faculty & Executive Dining</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Campus Location Label</span>
              </span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. South Campus - Wing 3, SAC Ground Floor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a180a] border border-amber-500/30 text-sm text-[#FAF6EE] placeholder:text-[#6a8070] focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Timings */}
          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Standard Meal Windows</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#9ab39a] block mb-1">Breakfast</span>
                <input
                  type="text"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a180a] border border-amber-500/20 text-xs text-[#FAF6EE] font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#9ab39a] block mb-1">Lunch</span>
                <input
                  type="text"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a180a] border border-amber-500/20 text-xs text-[#FAF6EE] font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#9ab39a] block mb-1">Dinner</span>
                <input
                  type="text"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-[#0a180a] border border-amber-500/20 text-xs text-[#FAF6EE] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => setIsAddMessOpen(false)}
              className="px-4 py-2 rounded-xl border border-amber-500/30 text-xs font-semibold text-[#9ab39a] hover:text-[#FAF6EE] hover:bg-forest-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-forest-950 text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Mess Hall</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
