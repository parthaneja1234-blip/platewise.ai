"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Star,
  CheckCircle2,
  XCircle,
  Sparkles,
  QrCode,
  Key,
  Clock,
  MessageSquare,
  TrendingUp,
  Award,
  RefreshCw,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { appApi, demoApi } from "@/lib/api";
import { formatKg, formatNumber } from "@/lib/formatters";

export default function StudentEngagementPage() {
  const { activeMessId, activeMess } = useAppContext();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<{
    date: string;
    rsvps: { eating: number; skipping: number; total: number };
    rating_summary: { average: number; total_reviews: number };
    feedback_stream: Array<{
      id: string;
      date: string;
      meal: string;
      rating: number;
      feedback: string;
      created_at?: string;
    }>;
    popular_plates: any[];
  }>({
    date: new Date().toISOString().split("T")[0],
    rsvps: { eating: 480, skipping: 62, total: 542 },
    rating_summary: { average: 4.4, total_reviews: 48 },
    feedback_stream: [
      {
        id: "fb-1",
        date: "Today",
        meal: "Lunch",
        rating: 5,
        feedback: "Dal makhani was exceptionally good today. Great consistency and fresh rotis.",
      },
      {
        id: "fb-2",
        date: "Today",
        meal: "Lunch",
        rating: 4,
        feedback: "Rice was slightly dry, but sabzi and raita balanced it out nicely.",
      },
      {
        id: "fb-3",
        date: "Yesterday",
        meal: "Dinner",
        rating: 5,
        feedback: "Paneer butter masala portion was generous. Thank you!",
      },
    ],
    popular_plates: [],
  });

  const loadEngagement = async () => {
    try {
      setLoading(true);
      if (user && (user.role === "mess_manager" || user.role === "admin")) {
        const res = await appApi.owner.getEngagement(activeMessId);
        setEngagement(res);
      } else {
        // Demo mode fallback with realistic campus distribution
        const platesRes = await demoApi.getPopularPlates(activeMessId);
        setEngagement((prev) => ({
          ...prev,
          popular_plates: (platesRes.popular_plates || platesRes.plates || []).slice(0, 4),
        }));
      }
    } catch (err) {
      console.warn("Engagement fetch notice, using fallback metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngagement();
  }, [activeMessId, user]);

  const capacity = activeMess?.capacity || 850;
  const rsvpPct = Math.round((engagement.rsvps.total / capacity) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#182818] border border-emerald-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-amber-500/5 to-transparent pointer-events-none rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Users className="w-4 h-4" />
              <span>Student Diner Pulse &bull; {activeMess?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#f5eedc]">
              Student Engagement & Feedback
            </h1>
            <p className="text-sm text-[#f5eedc]/70 mt-2 max-w-xl leading-relaxed">
              Real-time headcount confirmations, diner meal ratings, and popular plates composed by
              students. Track eating vs skipping before production cutoffs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0E2412] text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Manage Join Codes</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Headcount confirmed */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#728479]">
            <span className="text-xs font-bold uppercase tracking-wider">Eating Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#14211a]">
              {engagement.rsvps.eating}
            </span>
            <span className="text-xs text-[#728479]">diners</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Table reservations locked in
          </div>
        </div>

        {/* Metric 2: Skipping confirmed */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#728479]">
            <span className="text-xs font-bold uppercase tracking-wider">Skipping Noted</span>
            <XCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#14211a]">
              {engagement.rsvps.skipping}
            </span>
            <span className="text-xs text-[#728479]">students</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 font-medium">
            ~{formatKg((engagement.rsvps.skipping ?? 0) * 0.35, 1)} food prep saved
          </div>
        </div>

        {/* Metric 3: Response Rate */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#728479]">
            <span className="text-xs font-bold uppercase tracking-wider">Cutoff Participation</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#14211a]">{rsvpPct}%</span>
            <span className="text-xs text-[#728479]">of {capacity} cap</span>
          </div>
          <div className="mt-2 text-[11px] text-[#728479]">
            {engagement.rsvps.total} responses recorded
          </div>
        </div>

        {/* Metric 4: Average Diner Rating */}
        <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#728479]">
            <span className="text-xs font-bold uppercase tracking-wider">Meal Satisfaction</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#14211a]">
              {engagement.rating_summary.average}
            </span>
            <span className="text-xs text-amber-600 font-semibold">/ 5.0</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Based on {engagement.rating_summary.total_reviews} verified diner reviews
          </div>
        </div>
      </div>

      {/* Main Grid: Feedback Stream & Popular Plates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Feedback Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#14211a] uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Live Student Meal Feedback</span>
              </h2>
              <button
                type="button"
                onClick={loadEngagement}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-3">
              {engagement.feedback_stream.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white border border-[#e3ded0] shadow-xs hover:border-emerald-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF8F2] border border-[#e3ded0] text-[10px] font-bold text-[#14211a]">
                        {item.meal}
                      </span>
                      <span className="text-xs text-[#728479]">{item.date}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#14211a] leading-relaxed">
                    &ldquo;{item.feedback}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Popular Plates composed in Plate Studio */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#FAF8F2] border border-[#e3ded0] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#14211a] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Popular Student Plates</span>
              </h2>
            </div>
            <p className="text-xs text-[#728479] mb-4">
              Top meal compositions crafted by students dining at {activeMess?.name}.
            </p>

            <div className="space-y-3">
              {engagement.popular_plates.map((plate) => (
                <div
                  key={plate.id}
                  className="p-3.5 rounded-xl bg-white border border-[#e3ded0] shadow-xs hover:border-emerald-500/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#14211a] truncate">
                      {plate.name}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {plate.total_kcal} kcal
                    </span>
                  </div>

                  <div className="text-[10px] text-[#728479] flex items-center justify-between">
                    <span>
                      P: {plate.protein_g}g &bull; C: {plate.carbs_g}g &bull; F: {plate.fat_g}g
                    </span>
                    <span className="text-amber-700 font-semibold">
                      ₹{Math.round(plate.cost_inr || 28)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#e3ded0] text-center">
              <Link
                href="/plate-studio"
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline"
              >
                Open 3D Plate Studio &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
