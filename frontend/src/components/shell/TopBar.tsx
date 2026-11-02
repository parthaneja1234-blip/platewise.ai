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
} from "lucide-react";
import clsx from "clsx";
import { demoApi, Mess } from "@/lib/api";

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

const defaultMesses: Mess[] = [
  {
    id: "mess-boys-a",
    name: "Boys Hostel Mess A",
    capacity: 850,
    type: "hostel_mess",
    current_turnout_pct: 88,
  },
  {
    id: "mess-central",
    name: "Central Cafeteria",
    capacity: 1400,
    type: "central_court",
    current_turnout_pct: 76,
  },
];

const roles = [
  { id: "manager", name: "Mess Manager", badge: "Operator", icon: Building2 },
  { id: "admin", name: "Admin / Warden", badge: "Superuser", icon: ShieldCheck },
  { id: "student", name: "Student", badge: "Diner", icon: User },
];

export default function TopBar({ onOpenCommandPalette }: TopBarProps) {
  // Mess selector state
  const [messes, setMesses] = useState<Mess[]>(defaultMesses);
  const [selectedMess, setSelectedMess] = useState<Mess>(defaultMesses[0]);
  const [messDropdownOpen, setMessDropdownOpen] = useState(false);
  const messRef = useRef<HTMLDivElement>(null);

  // Role selector state
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  // Notifications dropdown
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Date state (seeded demo date: 2026-11-02)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2));

  // Fetch messes from API on mount
  useEffect(() => {
    demoApi
      .getMesses()
      .then((res) => {
        if (res.messes && res.messes.length > 0) {
          setMesses(res.messes);
          setSelectedMess(res.messes[0]);
        }
      })
      .catch((err) => {
        console.warn("Using fallback messes:", err);
      });
  }, []);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
              {selectedMess.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#728479] shrink-0" />
          </button>

          {messDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white border border-[#e3ded0] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#728479] uppercase tracking-wider">
                Select Dining Hall
              </div>
              {messes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMess(m);
                    setMessDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F2] transition-colors focus-ring cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-[#14211a]">{m.name}</div>
                    <div className="text-[10px] text-[#728479]">
                      Capacity {m.capacity} • {m.current_turnout_pct}% avg turnout
                    </div>
                  </div>
                  {selectedMess.id === m.id && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
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
            <selectedRole.icon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="hidden md:inline font-medium">{selectedRole.name}</span>
            <ChevronDown className="w-3 h-3 text-[#728479] shrink-0" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-[#e3ded0] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#728479] uppercase tracking-wider">
                Switch Perspective
              </div>
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F2] transition-colors focus-ring cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-medium text-[#14211a]">{r.name}</span>
                    </div>
                    {selectedRole.id === r.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                );
              })}
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
