"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChefHat,
  Sparkles,
  ClipboardList,
  BookOpen,
  Leaf,
  Smartphone,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Building2,
  Plus,
  UtensilsCrossed,
  Settings,
  Users,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/context/AppContext";

export const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Today's Plan",
    href: "/today",
    icon: ChefHat,
    badge: "Live",
  },
  {
    name: "Forecast Lab",
    href: "/forecast",
    icon: Sparkles,
    badge: "AI",
  },
  {
    name: "Simulate Today",
    href: "/simulate",
    icon: PlayCircle,
    badge: "Rush",
  },
  {
    name: "Log Meals",
    href: "/log",
    icon: ClipboardList,
    badge: null,
  },
  {
    name: "Menu Planner",
    href: "/menu",
    icon: BookOpen,
    badge: null,
  },
  {
    name: "Foods & Calories",
    href: "/foods",
    icon: UtensilsCrossed,
    badge: "Edit",
  },
  {
    name: "Plate Studio",
    href: "/plate-studio",
    icon: Sparkles,
    badge: "3D",
  },
  {
    name: "Engagement",
    href: "/engagement",
    icon: Users,
    badge: "Pulse",
  },
  {
    name: "Impact",
    href: "/impact",
    icon: Leaf,
    badge: "-32%",
  },
  {
    name: "Student App",
    href: "/student",
    icon: Smartphone,
    badge: null,
  },
  {
    name: "Mess Settings",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
  {
    name: "Admin Console",
    href: "/admin",
    icon: ShieldCheck,
    badge: "Admin",
  },
];


interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { activeMess, setIsAddMessOpen } = useAppContext();

  return (
    <aside
      aria-label="Main application sidebar"
      className={clsx(
        "hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out bg-[#1a3a1a] text-[#f5eedc] border-r border-amber-500/15 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-4 border-b border-amber-500/15">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 focus-ring rounded-xl p-1"
          title="PlateWise AI Dashboard"
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-forest-950 font-serif font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.35)]">
            P
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-serif text-lg font-bold tracking-tight text-[#faf6ee] leading-tight">
                PlateWise <span className="text-amber-400 font-sans text-[11px] font-semibold px-1 py-0.2 rounded bg-amber-500/15 border border-amber-500/25 ml-0.5">AI</span>
              </span>
              <span className="text-[10px] text-[#9ab39a] tracking-wider uppercase font-medium">
                Mess Intelligence
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[#9ab39a] hover:text-amber-300 hover:bg-[#234c23] transition-colors focus-ring cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative focus-ring",
                isActive
                  ? "bg-[#2b5c2b] text-[#faf6ee] shadow-sm font-semibold border-l-4 border-amber-400"
                  : "text-[#f5eedc]/85 hover:bg-[#234c23] hover:text-[#faf6ee]"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-amber-400" : "text-[#9ab39a] group-hover:text-amber-300"
                )}
              />

              {!collapsed && (
                <span className="truncate flex-1 tracking-wide">{item.name}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={clsx(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold",
                    item.badge === "Live"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-amber-500/15 space-y-2">
        {/* About & Credits Link to /about */}
        <Link
          href="/about"
          title={collapsed ? "About & Credits" : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#9ab39a] hover:bg-[#234c23] hover:text-amber-300 transition-colors focus-ring"
        >
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          {!collapsed && <span>About & Credits</span>}
        </Link>

        {/* Dynamic Cafeteria Status Card */}
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-[#122812] border border-amber-500/15 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="text-[11px] font-semibold text-[#faf6ee] truncate" title={activeMess.name}>
                  {activeMess.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMessOpen(true)}
                className="p-1 rounded text-amber-400 hover:text-amber-200 hover:bg-forest-900 transition-colors cursor-pointer"
                title="Add New Dining Hall"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#9ab39a]">
              <span className="truncate">{activeMess.location || activeMess.campus_location || "Campus Hall"}</span>
              <span className="font-mono text-amber-400/90 shrink-0 ml-1">Cap: {activeMess.capacity}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-1">
            <button
              type="button"
              onClick={() => setIsAddMessOpen(true)}
              className="w-8 h-8 rounded-xl bg-[#122812] border border-amber-500/20 flex items-center justify-center text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
              title={`Active: ${activeMess.name} — Click to add dining hall`}
            >
              <Building2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

