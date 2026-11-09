"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Utensils,
  Sparkles,
  Star,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Check,
  X,
  Flame,
  Award,
  ChevronRight,
  LogOut,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { appApi, demoApi } from "@/lib/api";
import FoodIcon from "@/components/FoodIcon";
import PlateStudio from "@/components/plate/PlateStudio";

type StudentTab = "today" | "plate" | "rate" | "me";

export default function StudentAppPage() {
  const { user, isDemoMode, logout, exitDemoMode } = useAuth();
  const { activeMessId, activeMess, graphicsQuality, setGraphicsQuality } = useAppContext();

  const [activeTab, setActiveTab] = useState<StudentTab>("today");
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab 1: Today state
  const [todayData, setTodayData] = useState<{
    mess_name: string;
    current_meal: string;
    cutoff_time: string;
    is_cutoff_passed: boolean;
    menu_items: any[];
    my_rsvp: "eating" | "skipping" | null;
  }>({
    mess_name: activeMess?.name || "Hostel Dining Hall",
    current_meal: "Lunch",
    cutoff_time: "10:30 AM",
    is_cutoff_passed: false,
    menu_items: [],
    my_rsvp: null,
  });

  const [isRsvpSubmitting, setIsRsvpSubmitting] = useState<boolean>(false);

  // Tab 3: Rate state
  const [rateMeal, setRateMeal] = useState<string>("Lunch");
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [isRateSubmitting, setIsRateSubmitting] = useState<boolean>(false);
  const [recentReviews, setRecentReviews] = useState<Array<{
    id: string;
    date: string;
    meal: string;
    rating: number;
    feedback?: string;
  }>>([
    {
      id: "rev-1",
      date: "Yesterday",
      meal: "Dinner",
      rating: 5,
      feedback: "Paneer butter masala and rotis were fresh and warm. Great job!",
    },
    {
      id: "rev-2",
      date: "Nov 02",
      meal: "Lunch",
      rating: 4,
      feedback: "Good dal makhani, rice portion was perfect.",
    },
  ]);

  // Tab 4: Me state
  const [studentProfile, setStudentProfile] = useState<{
    full_name: string;
    email: string;
    mess_name: string;
    streak_days: number;
    saved_plates_count: number;
  }>({
    full_name: user?.full_name || "Aarav Sharma",
    email: user?.email || "aarav.sharma@university.edu",
    mess_name: activeMess?.name || "Boys Hostel Mess A",
    streak_days: 7,
    saved_plates_count: 3,
  });

  const [dietPreference, setDietPreference] = useState<"veg" | "egg" | "all">("veg");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load live Today data from authenticated API or fallback to repository
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        if (user && user.role === "student") {
          const res = await appApi.student.getToday();
          if (isMounted) {
            setTodayData({
              mess_name: res.mess_name,
              current_meal: res.current_meal,
              cutoff_time: res.cutoff_time,
              is_cutoff_passed: res.is_cutoff_passed,
              menu_items: res.menu_items || [],
              my_rsvp: res.my_rsvp,
            });
          }
        } else {
          // Demo mode fallback
          const foodsRes = await demoApi.getFoods();
          const items = (foodsRes.foods || []).slice(0, 6);
          if (isMounted) {
            setTodayData({
              mess_name: activeMess?.name || "Hostel Mess A",
              current_meal: "Lunch",
              cutoff_time: "10:30 AM",
              is_cutoff_passed: false,
              menu_items: items,
              my_rsvp: null,
            });
          }
        }
      } catch (err) {
        console.warn("Student today data fetch notice, using fallback catalog:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, activeMess]);

  // Handle RSVP submission
  const handleRsvp = async (status: "eating" | "skipping") => {
    if (todayData.is_cutoff_passed) {
      showToast("Cutoff time has passed for this meal service.");
      return;
    }
    try {
      setIsRsvpSubmitting(true);
      const todayStr = new Date().toISOString().split("T")[0];

      if (user && user.role === "student") {
        await appApi.student.submitRsvp({
          date: todayStr,
          meal: todayData.current_meal,
          status,
        });
      } else {
        await demoApi.postRsvp({
          student_id: user?.id || "demo-student-id",
          mess_id: activeMessId,
          date: todayStr,
          meal: todayData.current_meal,
          status,
        });
      }

      setTodayData((prev) => ({ ...prev, my_rsvp: status }));
      showToast(
        status === "eating"
          ? "✅ RSVP Confirmed: Table marked for service."
          : "🌱 Noted skipping: Kitchen prep decremented to eliminate waste."
      );
    } catch (err: any) {
      showToast(err?.data?.detail || err?.message || "Failed to record RSVP response.");
    } finally {
      setIsRsvpSubmitting(false);
    }
  };

  // Handle Meal Rating submission
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsRateSubmitting(true);
      const todayStr = new Date().toISOString().split("T")[0];

      if (user && user.role === "student") {
        await appApi.student.rateMeal({
          date: todayStr,
          meal: rateMeal,
          rating: selectedRating,
          feedback: feedbackText || undefined,
        });
      }

      const newReview = {
        id: `rev-${Date.now()}`,
        date: "Today",
        meal: rateMeal,
        rating: selectedRating,
        feedback: feedbackText || "Rated service",
      };

      setRecentReviews((prev) => [newReview, ...prev]);
      setFeedbackText("");
      showToast("⭐ Thank you! Your feedback has been sent to the mess chef.");
    } catch (err: any) {
      showToast(err?.data?.detail || err?.message || "Failed to submit rating.");
    } finally {
      setIsRateSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between pb-24 relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 max-w-[390px] mx-auto z-50 bg-[#16381E] text-[#FAF8F2] p-3.5 rounded-xl border border-[#3E7B4C] shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Top App Bar Header */}
      <header className="sticky top-0 z-30 bg-[#0E2412]/95 backdrop-blur-md border-b border-[#1B4D2E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D5A38] to-[#1B4D2E] border border-[#3E7B4C] flex items-center justify-center shadow-xs">
            <span className="text-sm">🌱</span>
          </div>
          <div>
            <div className="text-xs font-bold text-[#FAF8F2] flex items-center gap-1.5">
              <span>PlateWise</span>
              <span className="text-[10px] font-mono text-[#D4AF37] px-1.5 py-0.2 rounded bg-[#1B4D2E]">
                Student
              </span>
            </div>
            <div className="text-[10px] text-[#A3B899] truncate max-w-[180px]">
              {todayData.mess_name}
            </div>
          </div>
        </div>

        {/* Profile Avatar / Quick Action */}
        <button
          type="button"
          onClick={() => setActiveTab("me")}
          id="student-header-profile-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#16381E] border border-[#2D5A38] text-xs text-[#FAF8F2] hover:border-[#D4AF37]/50 transition-colors cursor-pointer"
        >
          <div className="w-4 h-4 rounded-full bg-[#D4AF37] text-[#0E2412] font-bold text-[9px] flex items-center justify-center">
            {studentProfile.full_name[0] || "S"}
          </div>
          <span className="text-[11px] font-medium hidden sm:inline">
            {studentProfile.full_name.split(" ")[0]}
          </span>
        </button>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: TODAY (Menu, Cutoff, RSVP) */}
        {/* ================================================================= */}
        {activeTab === "today" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Meal Service & Cutoff Card */}
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-4 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1">
                  <span>⏰</span> {todayData.current_meal} Service
                </span>
                <span className="text-[10px] text-[#A3B899] bg-[#0E2412] px-2 py-0.5 rounded-full border border-[#2D5A38]">
                  Cutoff {todayData.cutoff_time}
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#FAF8F2] tracking-tight">
                Are you dining today?
              </h2>
              <p className="text-xs text-[#A3B899] mt-0.5 mb-4 leading-relaxed">
                Confirming before {todayData.cutoff_time} scales batch preparation accurately to eliminate food waste.
              </p>

              {/* RSVP Action Buttons (Min 44px targets) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isRsvpSubmitting || todayData.is_cutoff_passed}
                  onClick={() => handleRsvp("eating")}
                  id="student-rsvp-eating-btn"
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    todayData.my_rsvp === "eating"
                      ? "bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/40"
                      : "bg-[#0E2412] hover:bg-[#1B4D2E] border-[#2D5A38] text-[#FAF8F2]"
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Eating ({todayData.my_rsvp === "eating" ? "Confirmed" : "I'm coming"})</span>
                </button>

                <button
                  type="button"
                  disabled={isRsvpSubmitting || todayData.is_cutoff_passed}
                  onClick={() => handleRsvp("skipping")}
                  id="student-rsvp-skipping-btn"
                  className={`min-h-[48px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    todayData.my_rsvp === "skipping"
                      ? "bg-amber-700/80 border-amber-500 text-white shadow-lg shadow-amber-950/40"
                      : "bg-[#0E2412] hover:bg-[#1B4D2E] border-[#2D5A38] text-[#FAF8F2]"
                  }`}
                >
                  <X className="w-4 h-4 text-amber-400" />
                  <span>Skipping ({todayData.my_rsvp === "skipping" ? "Saved" : "Save food"})</span>
                </button>
              </div>

              {todayData.my_rsvp && (
                <div className="mt-3 pt-3 border-t border-[#2D5A38]/50 flex items-center gap-2 text-[11px] text-[#D4AF37]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Response recorded. Thank you for helping keep campus waste to zero!
                  </span>
                </div>
              )}
            </div>

            {/* Today's Menu Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#FAF8F2] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Today&apos;s {todayData.current_meal} Menu</span>
                </h3>
                <span className="text-[11px] text-[#A3B899]">
                  {todayData.menu_items.length} items served
                </span>
              </div>

              <div className="space-y-2.5">
                {todayData.menu_items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-[#16381E] border border-[#2D5A38] flex items-center justify-between gap-3 shadow-xs hover:border-[#3E7B4C] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0E2412] border border-[#2D5A38] flex items-center justify-center shrink-0">
                        <FoodIcon dishId={item.id || item.name || "food"} name={item.name} size="sm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              item.veg ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            title={item.veg ? "Vegetarian" : "Non-Veg"}
                          />
                          <span className="text-xs font-bold text-[#FAF8F2]">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A3B899] mt-0.5">
                          {item.serving_weight_g || 150}g &bull;{" "}
                          <span className="text-[#D4AF37] font-semibold">
                            {item.kcal_per_serving || item.kcal_per_unit || 150} kcal
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("plate")}
                      id={`add-to-plate-btn-${idx}`}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1B4D2E] hover:bg-[#2D5A38] text-[11px] font-semibold text-[#FAF8F2] border border-[#3E7B4C] shrink-0 cursor-pointer flex items-center gap-1"
                      title="Compose in Plate Studio"
                    >
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>Plate</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: PLATE (3D Plate Studio + Calories) */}
        {/* ================================================================= */}
        {activeTab === "plate" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#FAF8F2] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>Plate Studio</span>
                </h2>
                <p className="text-[11px] text-[#A3B899]">
                  Design your meal, see real-time calories & balance nutrition
                </p>
              </div>
            </div>

            {/* Embedded Plate Studio Component */}
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-2 sm:p-3 shadow-xl">
              <PlateStudio />
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: RATE (Meal Rating & Feedback) */}
        {/* ================================================================= */}
        {activeTab === "rate" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-4 shadow-lg">
              <h2 className="text-base font-bold text-[#FAF8F2] mb-1">
                Rate Your Meal
              </h2>
              <p className="text-xs text-[#A3B899] mb-4">
                Direct feedback goes to the cafeteria head chef to adjust taste, seasoning, and portions.
              </p>

              <form onSubmit={handleRatingSubmit} className="space-y-4">
                {/* Meal selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-1.5">
                    Select Meal Service
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Breakfast", "Lunch", "Dinner"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setRateMeal(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
                          rateMeal === m
                            ? "bg-[#D4AF37] text-[#0E2412] border-[#D4AF37]"
                            : "bg-[#0E2412] text-[#A3B899] border-[#2D5A38] hover:border-[#3E7B4C]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Star Rating (Min 44px tap targets) */}
                <div>
                  <label className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-2">
                    Star Rating
                  </label>
                  <div className="flex items-center justify-between bg-[#0E2412] p-3 rounded-xl border border-[#2D5A38]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        id={`star-btn-${star}`}
                        className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[#1B4D2E]/60 transition-transform active:scale-90 cursor-pointer"
                        title={`${star} star`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= selectedRating
                              ? "text-[#D4AF37] fill-[#D4AF37]"
                              : "text-[#5A7A60]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-right text-[11px] text-[#D4AF37] mt-1 font-semibold">
                    {selectedRating === 5 && "Excellent! Delicious & fresh"}
                    {selectedRating === 4 && "Very Good — Satisfying meal"}
                    {selectedRating === 3 && "Average — Met basic expectations"}
                    {selectedRating === 2 && "Fair — Needs attention"}
                    {selectedRating === 1 && "Poor — Food quality issue"}
                  </div>
                </div>

                {/* Qualitative Feedback (Font-size 16px to prevent iOS auto-zoom) */}
                <div>
                  <label
                    htmlFor="feedback-textarea"
                    className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-1.5"
                  >
                    Feedback for the Kitchen (Optional)
                  </label>
                  <textarea
                    id="feedback-textarea"
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell the chef what tasted best or what could be improved..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E2412] border border-[#2D5A38] text-[#FAF8F2] placeholder-[#5A7A60] text-base focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRateSubmitting}
                  id="submit-rating-btn"
                  className="w-full min-h-[44px] py-3 rounded-xl bg-[#D4AF37] hover:bg-[#E5BF48] text-[#0E2412] font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isRateSubmitting ? "Submitting..." : "Submit Rating"}
                </button>
              </form>
            </div>

            {/* Recent Community Feedback */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#A3B899] uppercase tracking-wider">
                Recent Dining Reviews
              </h3>
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-[#16381E] border border-[#2D5A38] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FAF8F2]">
                      {rev.meal} Service
                    </span>
                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  {rev.feedback && (
                    <p className="text-[11px] text-[#A3B899] leading-snug">
                      &ldquo;{rev.feedback}&rdquo;
                    </p>
                  )}
                  <div className="text-[9px] text-[#5A7A60] font-mono">
                    {rev.date} &bull; Verified Diner
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: ME (My Plates, Streak, Settings) */}
        {/* ================================================================= */}
        {activeTab === "me" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Student ID Card */}
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-[#0E2412] font-extrabold text-xl flex items-center justify-center shadow-md">
                  {studentProfile.full_name[0] || "S"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#FAF8F2]">
                    {studentProfile.full_name}
                  </h2>
                  <p className="text-xs text-[#A3B899] truncate max-w-[200px]">
                    {studentProfile.email}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0E2412] border border-[#2D5A38] text-[10px] text-[#D4AF37]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{studentProfile.mess_name}</span>
                  </div>
                </div>
              </div>

              {/* Dining Streak Banner */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[#1B4D2E] to-[#2D5A38] border border-[#3E7B4C] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="text-xs font-bold text-[#FAF8F2]">
                      {studentProfile.streak_days}-Day Zero-Waste Streak!
                    </div>
                    <div className="text-[10px] text-[#A3B899]">
                      Helped eliminate ~4.2 kg campus kitchen waste
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-[#D4AF37]">
                  TOP 5%
                </div>
              </div>
            </div>

            {/* Dietary Preference Card */}
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-4 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-[#FAF8F2] uppercase tracking-wider">
                Dietary Preference
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "veg", label: "Pure Veg 🥦" },
                  { id: "egg", label: "Eggetarian 🥚" },
                  { id: "all", label: "Non-Veg 🍗" },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDietPreference(d.id as any);
                      showToast(`Dietary preference set to ${d.label}`);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
                      dietPreference === d.id
                        ? "bg-emerald-600 border-emerald-400 text-white"
                        : "bg-[#0E2412] text-[#A3B899] border-[#2D5A38] hover:border-[#3E7B4C]"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Graphics Quality Control */}
            <div className="bg-[#16381E] border border-[#2D5A38] rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#FAF8F2] uppercase tracking-wider">
                    3D Visual Graphics
                  </h3>
                  <p className="text-[10px] text-[#A3B899]">
                    Set Low on older iPhones to conserve battery
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#D4AF37] uppercase">
                  {graphicsQuality}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["auto", "low", "off"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setGraphicsQuality(q)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer min-h-[44px] ${
                      graphicsQuality === q
                        ? "bg-[#D4AF37] text-[#0E2412] border-[#D4AF37]"
                        : "bg-[#0E2412] text-[#A3B899] border-[#2D5A38] hover:border-[#3E7B4C]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-2 pt-2">
              <Link
                href="/about"
                className="w-full min-h-[44px] p-3 rounded-xl bg-[#16381E] border border-[#2D5A38] flex items-center justify-between text-xs text-[#FAF8F2] hover:border-[#3E7B4C] transition-all"
              >
                <span>About PlateWise & Scientific Credits</span>
                <ChevronRight className="w-4 h-4 text-[#A3B899]" />
              </Link>

              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  id="student-logout-btn"
                  className="w-full min-h-[44px] p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-950/60 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              ) : isDemoMode ? (
                <button
                  type="button"
                  onClick={exitDemoMode}
                  id="student-exit-demo-btn"
                  className="w-full min-h-[44px] p-3 rounded-xl bg-[#1B4D2E] border border-[#3E7B4C] text-[#FAF8F2] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#2D5A38] transition-all cursor-pointer"
                >
                  <span>Exit Demo & Sign In</span>
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* Fixed Bottom Navigation Bar (Phone-first, 44px min targets) */}
      {/* =================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[420px] mx-auto bg-[#0E2412]/95 backdrop-blur-xl border-t border-[#1B4D2E] px-2 py-1 flex items-center justify-around shadow-2xl pb-[calc(env(safe-area-inset-bottom)+4px)]">
        {/* 1. Today Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("today")}
          id="tab-today-btn"
          className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "today"
              ? "text-[#D4AF37] bg-[#16381E] border border-[#2D5A38]"
              : "text-[#A3B899] hover:text-[#FAF8F2]"
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Today</span>
        </button>

        {/* 2. Plate Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("plate")}
          id="tab-plate-btn"
          className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "plate"
              ? "text-[#D4AF37] bg-[#16381E] border border-[#2D5A38]"
              : "text-[#A3B899] hover:text-[#FAF8F2]"
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Plate</span>
        </button>

        {/* 3. Rate Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("rate")}
          id="tab-rate-btn"
          className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "rate"
              ? "text-[#D4AF37] bg-[#16381E] border border-[#2D5A38]"
              : "text-[#A3B899] hover:text-[#FAF8F2]"
          }`}
        >
          <Star className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Rate</span>
        </button>

        {/* 4. Me Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("me")}
          id="tab-me-btn"
          className={`flex-1 min-h-[48px] py-1.5 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
            activeTab === "me"
              ? "text-[#D4AF37] bg-[#16381E] border border-[#2D5A38]"
              : "text-[#A3B899] hover:text-[#FAF8F2]"
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">Me</span>
        </button>
      </nav>
    </div>
  );
}
