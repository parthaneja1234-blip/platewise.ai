"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  Trash2,
  Plus,
  Save,
  Check,
  Key,
  Copy,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { demoApi, appApi } from "@/lib/api";

export default function MessSettingsPage() {
  const { activeMessId, activeMess, messes, setActiveMessId, refreshMesses, setIsAddMessOpen } =
    useAppContext();

  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState<number>(850);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("hostel_mess");
  const [breakfastTime, setBreakfastTime] = useState("07:30 - 09:30");
  const [lunchTime, setLunchTime] = useState("12:00 - 14:30");
  const [dinnerTime, setDinnerTime] = useState("19:30 - 21:30");

  const { user } = useAuth();
  const [joinCodes, setJoinCodes] = useState<any[]>([]);
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadJoinCodes = async () => {
    try {
      if (user && (user.role === "mess_manager" || user.role === "admin")) {
        const codes = await appApi.owner.listJoinCodes(activeMessId);
        setJoinCodes(codes || []);
      }
    } catch {
      // Ignore in demo mode
    }
  };

  useEffect(() => {
    loadJoinCodes();
  }, [activeMessId, user]);

  const handleGenerateJoinCode = async () => {
    setIsGeneratingCode(true);
    setNewGeneratedCode(null);
    try {
      if (user && (user.role === "mess_manager" || user.role === "admin")) {
        const res = await appApi.owner.createJoinCode({
          mess_id: activeMessId,
          max_uses: 50,
          valid_days: 7,
        });
        setNewGeneratedCode(res.code);
        await loadJoinCodes();
        showToast("New student join code generated.");
      } else {
        const mockCode = `PW-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
        setNewGeneratedCode(mockCode);
        showToast("Generated demo student join code.");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to generate join code.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    try {
      await appApi.owner.deactivateJoinCode(codeId);
      await loadJoinCodes();
      showToast("Join code deactivated.");
    } catch (err: any) {
      showToast(err?.message || "Failed to deactivate code.");
    }
  };

  useEffect(() => {
    if (activeMess) {
      setName(activeMess.name);
      setCapacity(activeMess.capacity);
      setLocation(activeMess.location || "");
      setType(activeMess.type || "hostel_mess");
      setBreakfastTime(activeMess.breakfast_time || "07:30 - 09:30");
      setLunchTime(activeMess.lunch_time || "12:00 - 14:30");
      setDinnerTime(activeMess.dinner_time || "19:30 - 21:30");
      setConfirmDelete(false);
      setError(null);
    }
  }, [activeMess]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a mess hall name.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await demoApi.updateMess(activeMessId, {
        name,
        capacity: Number(capacity),
        location,
        type,
        breakfast_time: breakfastTime,
        lunch_time: lunchTime,
        dinner_time: dinnerTime,
      });
      await refreshMesses();
      showToast(`Updated settings for "${name}".`);
    } catch (err: any) {
      setError(err?.message || "Failed to update mess hall settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMess = async () => {
    if (messes.length <= 1) {
      setError("Cannot delete the only remaining dining hall on campus.");
      return;
    }
    setIsDeleting(true);
    try {
      await demoApi.deleteMess(activeMessId);
      showToast(`Deleted "${name}".`);
      await refreshMesses();
      // Select the first remaining mess
      const remaining = messes.filter((m) => m.id !== activeMessId);
      if (remaining.length > 0) {
        setActiveMessId(remaining[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to delete mess.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const isOnlyMess = messes.length <= 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
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
              <Settings className="w-4 h-4" />
              <span>Campus Facility Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#f5eedc]">
              Dining Hall Settings
            </h1>
            <p className="text-sm text-[#f5eedc]/70 mt-2 max-w-xl leading-relaxed">
              Configure headcount capacity, service window operating hours, and location
              labels for <span className="text-emerald-300 font-semibold">{activeMess?.name}</span>.
              All changes update real-time forecast bounds and baseline capacity models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddMessOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dining Hall</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campus Facility Switcher Bar */}
      <div className="p-3 bg-[#152315] border border-emerald-500/20 rounded-xl flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#f5eedc]/60 font-medium whitespace-nowrap pl-2">
            Select Dining Hall:
          </span>
          <div className="flex items-center gap-1.5">
            {messes.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMessId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  m.id === activeMessId
                    ? "bg-emerald-600 text-white shadow-sm font-semibold"
                    : "bg-[#101b10] text-[#f5eedc]/70 hover:text-white border border-emerald-500/15"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-emerald-400 font-mono pr-2">
          {messes.length} active facilities
        </span>
      </div>

      {/* Settings Form */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-6 shadow-md">
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Facility Identifiers */}
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-emerald-300 border-b border-emerald-500/15 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> General Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Dining Hall Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-2 text-sm text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Facility Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                >
                  <option value="hostel_mess">Hostel Dining Hall</option>
                  <option value="central_cafeteria">Central Campus Cafeteria</option>
                  <option value="faculty_dining">Faculty & Guest Dining</option>
                  <option value="night_mess">Extended Hours Canteen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Nominal Seating & Kitchen Capacity *
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400/60" />
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <p className="text-[11px] text-[#f5eedc]/50 mt-1">
                  Defines default baseline attendance used in prediction algorithms.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Campus Location Label
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-400/60" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. North Campus - Block 4"
                    className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl pl-9 pr-3 py-2 text-xs text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Meal Shift Operating Windows */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-serif font-bold text-emerald-300 border-b border-emerald-500/15 pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Service Shift Windows
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Breakfast Shift
                </label>
                <input
                  type="text"
                  value={breakfastTime}
                  onChange={(e) => setBreakfastTime(e.target.value)}
                  placeholder="07:30 - 09:30"
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs font-mono text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Lunch Shift
                </label>
                <input
                  type="text"
                  value={lunchTime}
                  onChange={(e) => setLunchTime(e.target.value)}
                  placeholder="12:00 - 14:30"
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs font-mono text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#f5eedc]/80 mb-1">
                  Dinner Shift
                </label>
                <input
                  type="text"
                  value={dinnerTime}
                  onChange={(e) => setDinnerTime(e.target.value)}
                  placeholder="19:30 - 21:30"
                  className="w-full bg-[#121f12] border border-emerald-500/25 rounded-xl px-3 py-2 text-xs font-mono text-[#f5eedc] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteMess}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete Facility"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-[#f5eedc]/60 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isOnlyMess}
                  onClick={() => setConfirmDelete(true)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isOnlyMess
                      ? "text-[#f5eedc]/30 cursor-not-allowed"
                      : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  }`}
                  title={isOnlyMess ? "Cannot delete the only facility on campus" : undefined}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Dining Hall</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
