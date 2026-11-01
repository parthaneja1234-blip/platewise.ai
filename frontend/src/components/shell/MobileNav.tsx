"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  ClipboardList,
  BookOpen,
  MoreHorizontal,
  Sparkles,
  Leaf,
  Smartphone,
  Info,
  X,
} from "lucide-react";
import clsx from "clsx";

const primaryMobileItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: ChefHat },
  { name: "Log", href: "/log", icon: ClipboardList },
  { name: "Menu", href: "/menu", icon: BookOpen },
];

const secondaryMobileItems = [
  { name: "Forecast Lab", href: "/forecast", icon: Sparkles, desc: "Simulate weather & attendance" },
  { name: "Impact", href: "/impact", icon: Leaf, desc: "Cost & landfill diversion ledger" },
  { name: "Student App", href: "/student", icon: Smartphone, desc: "Student RSVP & live crowd meter" },
  { name: "About PlateWise", href: "/welcome", icon: Info, desc: "3D kitchen demo & story" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1a3a1a] border-t border-amber-500/20 text-[#f5eedc] px-2 py-1 shadow-2xl"
      >
        <div className="flex items-center justify-around h-16">
          {primaryMobileItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-[11px] font-medium transition-colors focus-ring",
                  isActive
                    ? "text-amber-400 font-semibold"
                    : "text-[#9ab39a] hover:text-[#f5eedc]"
                )}
              >
                <Icon className={clsx("w-5 h-5 mb-0.5", isActive && "text-amber-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-[11px] font-medium text-[#9ab39a] hover:text-[#f5eedc] focus-ring"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* "More" Drawer Modal for Secondary Routes */}
      {moreDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More navigation options"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setMoreDrawerOpen(false)}
        >
          <div
            className="bg-[#142814] text-[#FAF6EE] rounded-t-3xl border-t border-amber-500/30 p-6 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="font-serif text-lg font-semibold text-[#FAF6EE]">
                Navigation & Perspective
              </div>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#9ab39a] hover:text-white focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {secondaryMobileItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={clsx(
                      "flex items-center gap-3.5 p-3 rounded-2xl transition-colors focus-ring",
                      isActive
                        ? "bg-[#2b5c2b] text-[#faf6ee] font-medium"
                        : "hover:bg-[#1f431f] text-[#EDE6D6]"
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[#FAF6EE]">{item.name}</div>
                      <div className="text-xs text-[#9ab39a] font-light">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
