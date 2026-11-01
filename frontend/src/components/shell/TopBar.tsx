"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  ShieldCheck,
  User,
  Building2,
  Check,
} from "lucide-react";
import clsx from "clsx";

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

const messes = [
  { id: "h1", name: "Hostel 1 Mess (Main)", code: "H1-MAIN", meals: "1,200/day" },
  { id: "h4", name: "Hostel 4 Mess (South)", code: "H4-SOUTH", meals: "950/day" },
  { id: "faculty", name: "Faculty Executive Lounge", code: "FAC-EXEC", meals: "280/day" },
  { id: "central", name: "Central Food Court", code: "CFC-PUB", meals: "1,850/day" },
];

const roles = [
  { id: "manager", name: "Mess Manager", badge: "Operator", icon: Building2 },
  { id: "admin", name: "Admin", badge: "Superuser", icon: ShieldCheck },
  { id: "student", name: "Student", badge: "Diner", icon: User },
];

export default function TopBar({ onOpenCommandPalette }: TopBarProps) {
  // Mess selector state (in-memory React state, no localStorage)
  const [selectedMess, setSelectedMess] = useState(messes[0]);
  const [messDropdownOpen, setMessDropdownOpen] = useState(false);
  const messRef = useRef<HTMLDivElement>(null);

  // Role selector state
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2)); // Mon Nov 02 2026

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-18 bg-[#faf6ee]/90 backdrop-blur-md border-b border-[#e8dfcf] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left Area: Mess Selector & Date Controls */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
        {/* Mess Selector Dropdown */}
        <div ref={messRef} className="relative">
          <button
            type="button"
            onClick={() => setMessDropdownOpen(!messDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-xs sm:text-sm font-medium text-[#1b2e24] shadow-sm transition-all focus-ring"
            aria-haspopup="listbox"
            aria-expanded={messDropdownOpen}
          >
            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-[#1b2e24] truncate max-w-[130px] sm:max-w-[180px]">
              {selectedMess.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#7d9185] shrink-0" />
          </button>

          {messDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-white border border-[#e8dfcf] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#7d9185] uppercase tracking-wider">
                Select Dining Mess
              </div>
              {messes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMess(m);
                    setMessDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#faf6ee] transition-colors focus-ring"
                >
                  <div>
                    <div className="font-medium text-[#1b2e24]">{m.name}</div>
                    <div className="text-[10px] text-[#7d9185]">{m.meals} meals active</div>
                  </div>
                  {selectedMess.id === m.id && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Selector */}
        <div className="hidden sm:flex items-center bg-white border border-[#e8dfcf] rounded-xl shadow-sm text-xs font-medium text-[#1b2e24]">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="p-2 hover:bg-[#faf6ee] rounded-l-xl text-[#7d9185] hover:text-[#1b2e24] transition-colors focus-ring"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 border-x border-[#e8dfcf]/60">
            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-mono text-xs">{formatDate(currentDate)}</span>
          </div>

          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="p-2 hover:bg-[#faf6ee] rounded-r-xl text-[#7d9185] hover:text-[#1b2e24] transition-colors focus-ring"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Area: Demo Badge, Role Switcher, and Cmd+K Search */}
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

        {/* Role Switcher Dropdown */}
        <div ref={roleRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-xs font-medium text-[#1b2e24] shadow-sm transition-all focus-ring"
            aria-haspopup="listbox"
            aria-expanded={roleDropdownOpen}
          >
            <selectedRole.icon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="hidden md:inline font-medium">{selectedRole.name}</span>
            <ChevronDown className="w-3 h-3 text-[#7d9185] shrink-0" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-[#e8dfcf] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#7d9185] uppercase tracking-wider">
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
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#faf6ee] transition-colors focus-ring"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-medium text-[#1b2e24]">{r.name}</span>
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#e8dfcf] hover:border-amber-500/40 text-xs text-[#7d9185] hover:text-[#1b2e24] shadow-sm transition-all focus-ring"
          title="Search or jump to page (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden lg:inline text-xs">Jump to...</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#faf6ee] text-[#1b2e24] border border-[#e8dfcf]">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
