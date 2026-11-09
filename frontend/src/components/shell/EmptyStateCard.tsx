"use client";

import React from "react";
import clsx from "clsx";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

interface EmptyStateCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlightText?: string;
  metrics?: { label: string; value: string }[];
  actions?: EmptyStateAction[];
  className?: string;
}

export default function EmptyStateCard({
  icon: Icon,
  title,
  description,
  highlightText,
  metrics,
  actions,
  className,
}: EmptyStateCardProps) {
  return (
    <div
      className={clsx(
        "w-full rounded-3xl bg-white border border-[#e8dfcf] p-8 sm:p-12 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden",
        className
      )}
    >
      {/* Ambient background accent */}
      <div className="absolute top-0 right-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Emblem Sprite Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#faf6ee] border border-amber-500/25 flex items-center justify-center text-amber-600 mb-6 shadow-inner animate-[bounce_3s_ease-in-out_infinite]">
        <Icon className="w-8 h-8 drop-shadow-xs" />
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1b2e24] mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-[#53675c] font-light max-w-lg mx-auto leading-relaxed mb-6">
        {description}
      </p>

      {/* Highlight Box if provided */}
      {highlightText && (
        <div className="mb-8 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 font-medium max-w-md">
          {highlightText}
        </div>
      )}

      {/* Metrics Row if provided */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-4 rounded-2xl bg-[#faf6ee] border border-[#e8dfcf] w-full max-w-lg mb-8">
          {metrics.map((m, idx) => (
            <div key={idx} className="text-center">
              <div className="text-[11px] text-[#7d9185] uppercase tracking-wider font-medium mb-0.5">
                {m.label}
              </div>
              <div className="font-serif text-lg font-bold text-[#1b2e24]">
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((act, idx) => {
            if (act.href) {
              return (
                <a
                  key={idx}
                  href={act.href}
                  className={clsx(
                    "px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all focus-ring",
                    act.primary
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-md transform hover:-translate-y-0.5"
                      : "bg-[#faf6ee] hover:bg-[#f0e7d8] text-[#1b2e24] border border-[#e8dfcf]"
                  )}
                >
                  {act.label}
                </a>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={act.onClick}
                className={clsx(
                  "px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all focus-ring cursor-pointer",
                  act.primary
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-md transform hover:-translate-y-0.5"
                    : "bg-[#faf6ee] hover:bg-[#f0e7d8] text-[#1b2e24] border border-[#e8dfcf]"
                )}
              >
                {act.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
