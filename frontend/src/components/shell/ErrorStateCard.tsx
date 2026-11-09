"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface ErrorStateCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  className?: string;
}

export default function ErrorStateCard({
  title = "Failed to load operational data",
  message = "An error occurred while connecting to the cafeteria intelligence service. Check your connection or verify backend health.",
  onRetry,
  actionLabel = "Retry Request",
  className,
}: ErrorStateCardProps) {
  return (
    <div
      className={clsx(
        "w-full rounded-2xl bg-white border border-[#e8dfcf] p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#c8553d]/10 border border-[#c8553d]/25 flex items-center justify-center text-[#c8553d] mb-4 shadow-inner">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#14211a] mb-2">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#728479] max-w-md mx-auto leading-relaxed mb-6 font-mono">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl bg-forest-950 hover:bg-forest-900 text-[#FAF8F2] text-xs font-semibold shadow-sm transition-all focus-ring flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
