"use client";

import React from "react";
import PageHeader from "@/components/shell/PageHeader";
import CreditsSection from "@/components/CreditsSection";
import Link from "next/link";
import { ExternalLink, Sparkles, BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="About PlateWise AI & 3D Model Credits"
        subtitle="Mission, open-source attribution, and CC0 Kenney Food Kit model registry credits."
        badge="Institutional AI"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/welcome"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-[#1b2e24] shadow-xs transition-all focus-ring flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
              <span>Interactive Story Landing</span>
            </Link>
          </div>
        }
      />

      {/* Purpose Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0e2412] to-[#1a3a1a] text-[#FAF8F2] border border-amber-500/25 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
            Tagline & Purpose
          </span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
          &ldquo;Cook what&apos;s needed. Save what matters.&rdquo;
        </h2>
        <p className="text-xs sm:text-sm text-[#8fa896] max-w-2xl leading-relaxed">
          Don&apos;t just save food, save the climate behind it. PlateWise AI eliminates guessing in college messes and dining halls through Bayesian attendance forecasting, calibrated batch prep sheets, and transparent environmental carbon tracking.
        </p>
      </div>

      {/* 3D Asset Attribution & Model Credits */}
      <div className="rounded-2xl overflow-hidden border border-[#e3ded0] bg-white shadow-xs">
        <CreditsSection />
      </div>
    </div>
  );
}
