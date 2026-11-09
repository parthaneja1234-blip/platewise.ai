"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ChefHat, Sparkles, ClipboardList } from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/context/AppContext";

const TABS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Plan", href: "/today", icon: ChefHat },
  { name: "Plate Studio", href: "/plate-studio", icon: Sparkles, badge: "3D" },
  { name: "Logs", href: "/log", icon: ClipboardList },
];

export default function MessTabs() {
  const pathname = usePathname();
  const { activeMess } = useAppContext();

  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-500/15">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto bg-[#132013] p-1 rounded-xl border border-emerald-500/20">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#f5eedc]/70 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
              {tab.badge && (
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isActive
                      ? "bg-emerald-950/80 text-emerald-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {activeMess && (
        <div className="hidden md:flex items-center gap-2 text-xs text-[#f5eedc]/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Mess:</span>
          <span className="font-semibold text-emerald-300">{activeMess.name}</span>
        </div>
      )}
    </div>
  );
}
