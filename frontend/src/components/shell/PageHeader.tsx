"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-[#e8dfcf]">
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1b2e24] tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#53675c] font-light max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
