"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  User,
  Building2,
  Check,
  Bell,
  Clock,
  AlertTriangle,
  Info,
  Plus,
} from "lucide-react";
import { useAppContext, ROLES } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ROLE_ICONS = {
  manager: Building2,
  admin: ShieldCheck,
  student: User,
};

export default function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const {
    messes,
    activeMess,
    setActiveMessId,
    activeRole,
    setActiveRole,
    setIsAddMessOpen,
  } = useAppContext();

  const { user, isDemoMode, logout, exitDemoMode } = useAuth();

  // Mess dropdown state
  const [messDropdownOpen, setMessDropdownOpen] = useState(false);
  const messRef = useRef<HTMLDivElement>(null);

  // Role selector state
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Date state (seeded demo date: 2026-11-02)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2));

  // Deterministic date formatter avoiding SSR/client locale mismatch
  const formatDate = (d: Date) => {
    return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const shiftDay = (days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (messRef.current && !messRef.current.contains(e.target as Node)) {
        setMessDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const RoleIcon = ROLE_ICONS[activeRole.id] || Building2;

  return (
    <header className="sticky top-0 z-20 h-18 bg-[#FAF8F2]/90 backdrop-blur-md border-b border-[#e3ded0] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Area: Mess Selector, Meal Countdown, Date Controls */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
        {/* Mess Selector Dropdown */}
        <div ref={messRef} className="relative">
          <button
            type="button"
            onClick={() => setMessDropdownOpen(!messDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e3ded0] hover:border-amber-500/40 text-xs sm:text-sm font-medium text-[#14211a] shadow-xs transition-all focus-ring cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={messDropdownOpen}
          >
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-[#14211a] truncate max-w-[130px] sm:max-w-[180px]">
              {activeMess.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#728479] shrink-0" />
          </button>

          {messDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white border border-[#e3ded0] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#728479] uppercase tracking-wider">
                Select Dining Hall
              </div>
              <div className="max-h-60 overflow-y-auto">
                {messes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMessId(m.id);
                      setMessDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F2] transition-colors focus-ring cursor-pointer"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="font-medium text-[#14211a] truncate">{m.name}</div>
                      <div className="text-[10px] text-[#728479] truncate">
                        Capacity {m.capacity} • {m.current_turnout_pct || 80}% avg turnout
                      </div>
                    </div>
                    {activeMess.id === m.id && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Add Mess Hall action button */}
              <div className="border-t border-[#e3ded0] mt-1 pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessDropdownOpen(false);
                    setIsAddMessOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs flex items-center gap-2 rounded-xl text-amber-800 hover:bg-amber-500/10 transition-colors font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>+ Add Dining Hall...</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Meal Countdown Chip */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#e3ded0] shadow-xs text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="font-medium text-[#14211a]">Lunch Service</span>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-500/15 px-1.5 py-0.2 rounded font-semibold">
            In 42m
          </span>
        </div>

        {/* Date Selector */}
        <div className="hidden sm:flex items-center bg-white border border-[#e3ded0] rounded-xl shadow-xs text-xs font-medium text-[#14211a]">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="p-2 hover:bg-[#FAF8F2] rounded-l-xl text-[#728479] hover:text-[#14211a] transition-colors focus-ring cursor-pointer"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 border-x border-[#e3ded0]/60">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="font-mono text-xs">{formatDate(currentDate)}</span>
          </div>

          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="p-2 hover:bg-[#FAF8F2] rounded-r-xl text-[#728479] hover:text-[#14211a] transition-colors focus-ring cursor-pointer"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Area: Demo Badge, Notifications, Role Switcher, and Cmd+K Search */}
      <div className="flex items-center gap-3">
        {/* Demo Data Synthetic Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-900 shrink-0"
          title="Campus test sandbox environment with synthetic timetable and attendance models"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline font-medium">Demo data</span>
          <span className="font-mono text-[10px] text-amber-700">(synthetic)</span>
        </div>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-xl bg-white border border-[#e3ded0] hover:border-amber-500/40 text-[#728479] hover:text-[#14211a] shadow-xs transition-all focus-ring cursor-pointer"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4 text-amber-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-80 rounded-2xl bg-white border border-[#e3ded0] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
              <div className="text-[11px] font-semibold text-[#728479] uppercase tracking-wider px-1">
                Active Kitchen Alerts
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs space-y-1">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Exam Period + Monsoon Rain</span>
                </div>
                <p className="text-[11px] text-[#4a5a50] leading-snug">
                  Tomorrow: Midsem exams and forecasted precipitation. Batch plan auto-adjusted by ~16%.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Surplus Redistribution Ready</span>
                </div>
                <p className="text-[11px] text-[#4a5a50] leading-snug">
                  Robin Hood Army volunteer chapter standby confirmed for 14:15 pickup.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Dropdown */}
        <div ref={roleRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e3ded0] hover:border-amber-500/40 text-xs font-medium text-[#14211a] shadow-xs transition-all focus-ring cursor-pointer"
            aria-haspopup="listbox"
            aria-expanded={roleDropdownOpen}
          >
            <RoleIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="hidden md:inline font-medium">{activeRole.name}</span>
            <ChevronDown className="w-3 h-3 text-[#728479] shrink-0" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-[#e3ded0] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#728479] uppercase tracking-wider">
                Switch Perspective
              </div>
              {ROLES.map((r) => {
                const Icon = ROLE_ICONS[r.id] || Building2;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRole(r.id);
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F2] transition-colors focus-ring cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-emerald-700" />
                      <div>
                        <div className="font-medium text-[#14211a]">{r.name}</div>
                        <div className="text-[10px] text-[#728479]">{r.badge}</div>
                      </div>
                    </div>
                    {activeRole.id === r.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}

              <div className="my-1.5 border-t border-[#e3ded0]" />

              {user ? (
                <div className="px-3 py-1.5">
                  <div className="text-[11px] font-semibold text-[#14211a] truncate" title={user.email}>
                    {user.full_name || user.email}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono capitalize">{user.role}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      logout();
                    }}
                    id="topbar-logout-btn"
                    className="w-full mt-2 py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : isDemoMode ? (
                <div className="px-3 py-1.5">
                  <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider mb-1">
                    Demo Mode
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      exitDemoMode();
                    }}
                    id="topbar-exit-demo-btn"
                    className="w-full py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Exit Demo & Sign In
                  </button>
                </div>
              ) : (
                <div className="px-3 py-1.5">
                  <a
                    href="/login"
                    className="block w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    Sign In
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cmd+K Search Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e3ded0] hover:border-amber-500/40 text-xs text-[#728479] hover:text-[#14211a] shadow-xs transition-all focus-ring cursor-pointer"
          title="Search or jump to page (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden lg:inline text-xs">Jump to...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#FAF8F2] text-[#14211a] border border-[#e3ded0]">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
