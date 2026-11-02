"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  RotateCcw,
  Presentation,
  CloudRain,
  GraduationCap,
  PartyPopper,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";
import { demoApi } from "@/lib/api";

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. The Waste Problem",
    subtitle: "Deck Slide 1: 100 kg prepared, 75 kg eaten, 25 kg wasted",
    route: "/dashboard",
    description:
      "Cafeterias cook on guesswork. Traditional operations prepare blindly for full capacity, wasting over 25% of fresh meals before service even ends.",
  },
  {
    step: 2,
    title: "2. The Six Inputs",
    subtitle: "Turnout, past logs, menu popularity, calendar, rain, events",
    route: "/dashboard",
    description:
      "PlateWise takes six operational signals: past consumption history, day of week, weather precipitation, academic exam schedules, and student RSVPs.",
  },
  {
    step: 3,
    title: "3. The Prediction Engine",
    subtitle: "Ridge regression model with 8.06% MAPE vs 53.8% capacity",
    route: "/today",
    description:
      "Explainable AI forecasts attendance distribution with p10-p90 intervals, avoiding costly stockouts while trimming over-preparation.",
  },
  {
    step: 4,
    title: "4. Kitchen Prep Output",
    subtitle: "Staged batch sheets, per-dish recommendations & drivers",
    route: "/today",
    description:
      "Every chef gets exact recipe quantities, portion kg, vs last week variance, and a surplus rescue countdown timer.",
  },
  {
    step: 5,
    title: "5. Real Climate Impact",
    subtitle: "Saved land, water, transport, and avoided landfill methane",
    route: "/dashboard",
    description:
      "Track live cumulative kg saved, INR budget recovered, and certified CO2e avoided meal after meal across all dining halls.",
  },
  {
    step: 6,
    title: "6. Student Attendance Loop",
    subtitle: "Eating vs Skipping loop directly calibrating headcounts",
    route: "/today",
    description:
      "Students confirm or skip meals on mobile, immediately shifting the kitchen's recommended batch production before ovens are lit.",
  },
];

export default function DemoDirector() {
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Presenter mode state
  const [presenterMode, setPresenterMode] = useState(false);

  // Simulation scenario toggles
  const [examDayActive, setExamDayActive] = useState(false);
  const [monsoonActive, setMonsoonActive] = useState(true);
  const [campusEventActive, setCampusEventActive] = useState(false);

  // Guided tour state
  const [tourIndex, setTourIndex] = useState<number | null>(null);

  // Handle presenter mode toggle
  useEffect(() => {
    if (presenterMode) {
      document.body.classList.add("presenter-mode");
    } else {
      document.body.classList.remove("presenter-mode");
    }
  }, [presenterMode]);

  const handleResetDemo = async () => {
    try {
      setIsResetting(true);
      await demoApi.postReset();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
      // Trigger a page reload or router refresh so all screens fetch clean seeded state
      router.refresh();
    } catch (err) {
      console.error("Failed to reset demo:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleStartTour = () => {
    setTourIndex(0);
    router.push(TOUR_STEPS[0].route);
  };

  const handleTourStep = (direction: "prev" | "next") => {
    if (tourIndex === null) return;
    const nextIdx =
      direction === "next"
        ? Math.min(TOUR_STEPS.length - 1, tourIndex + 1)
        : Math.max(0, tourIndex - 1);
    setTourIndex(nextIdx);
    router.push(TOUR_STEPS[nextIdx].route);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        {tourIndex !== null && (
          <div className="bg-[#0e2412] text-amber-300 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2">
            <span>Tour: Step {tourIndex + 1}/6</span>
            <button
              onClick={() => handleTourStep("next")}
              className="px-2 py-0.5 rounded bg-amber-500 text-forest-950 font-bold hover:bg-amber-400"
            >
              Next
            </button>
            <button
              onClick={() => setTourIndex(null)}
              className="p-1 text-amber-400/80 hover:text-amber-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-forest-900 to-forest-950 border border-amber-500/40 text-amber-300 font-sans text-xs font-semibold shadow-[0_10px_25px_rgba(14,36,18,0.5)] hover:border-amber-400 transition-all hover:scale-105 active:scale-95 focus-ring cursor-pointer"
          title="Demo Director & Pitch Guide"
        >
          <Sliders className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span>Demo Director</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </button>
      </div>

      {/* Floating Modal Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-96 max-w-[90vw] rounded-2xl bg-[#0e2412]/95 backdrop-blur-xl border border-amber-500/30 text-[#faf8f2] shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-amber-300 leading-none">
                  Demo Director
                </h3>
                <p className="text-[10px] text-[#8fa896] mt-0.5">
                  Hackathon pitch controls & scenario injection
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-[#8fa896] hover:text-[#faf8f2] hover:bg-forest-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Quick Global Reset */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-forest-900/60 border border-amber-500/20">
            <div>
              <div className="text-xs font-semibold text-[#faf8f2]">
                Reset Demo State
              </div>
              <div className="text-[10px] text-[#8fa896]">
                Clear in-memory RSVPs & custom logs
              </div>
            </div>
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                resetSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-500 hover:bg-amber-400 text-forest-950"
              )}
            >
              {resetSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reset!</span>
                </>
              ) : (
                <>
                  <RotateCcw
                    className={clsx(
                      "w-3.5 h-3.5",
                      isResetting && "animate-spin"
                    )}
                  />
                  <span>{isResetting ? "Resetting..." : "Reset"}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Pitch Guided Tour (6 Steps) */}
          <div className="p-3 rounded-xl bg-forest-900/40 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider text-[10px]">
                Deck Pitch Tour
              </span>
              <span className="text-[10px] font-mono text-[#8fa896]">
                6 Deck Slides
              </span>
            </div>

            {tourIndex === null ? (
              <button
                onClick={handleStartTour}
                className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Launch 3-Minute Story Tour</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2 bg-forest-950/70 p-2.5 rounded-lg border border-amber-500/20">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>{TOUR_STEPS[tourIndex].title}</span>
                  <span className="text-[10px] font-mono text-[#8fa896]">
                    {tourIndex + 1}/{TOUR_STEPS.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#e3ded0] leading-snug">
                  {TOUR_STEPS[tourIndex].description}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleTourStep("prev")}
                    disabled={tourIndex === 0}
                    className="p-1 rounded text-amber-400 hover:text-amber-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-[#8fa896]">
                    {TOUR_STEPS[tourIndex].route}
                  </span>
                  <button
                    onClick={() => handleTourStep("next")}
                    disabled={tourIndex === TOUR_STEPS.length - 1}
                    className="p-1 rounded text-amber-400 hover:text-amber-200 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Scenario Weather / Exam Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider text-[10px]">
              Active Prediction Factors
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExamDayActive(!examDayActive)}
                className={clsx(
                  "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  examDayActive
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                    : "bg-forest-900/40 border-amber-500/20 text-[#8fa896] hover:text-[#faf8f2]"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Exam Day</span>
                <span className="text-[9px] font-mono text-amber-400">
                  {examDayActive ? "-14%" : "Off"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMonsoonActive(!monsoonActive)}
                className={clsx(
                  "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  monsoonActive
                    ? "bg-sky-500/20 border-sky-400 text-sky-300 font-bold"
                    : "bg-forest-900/40 border-amber-500/20 text-[#8fa896] hover:text-[#faf8f2]"
                )}
              >
                <CloudRain className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Monsoon</span>
                <span className="text-[9px] font-mono text-sky-400">
                  {monsoonActive ? "+8%" : "Off"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCampusEventActive(!campusEventActive)}
                className={clsx(
                  "p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  campusEventActive
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                    : "bg-forest-900/40 border-amber-500/20 text-[#8fa896] hover:text-[#faf8f2]"
                )}
              >
                <PartyPopper className="w-4 h-4" />
                <span className="text-[10px] leading-tight">Campus Fest</span>
                <span className="text-[9px] font-mono text-emerald-400">
                  {campusEventActive ? "+12%" : "Off"}
                </span>
              </button>
            </div>
          </div>

          {/* 4. Presenter Mode Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
            <div className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-[#faf8f2]">
                Presenter Mode
              </span>
            </div>
            <button
              onClick={() => setPresenterMode(!presenterMode)}
              className={clsx(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-ring",
                presenterMode ? "bg-amber-500" : "bg-forest-800"
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  presenterMode ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
