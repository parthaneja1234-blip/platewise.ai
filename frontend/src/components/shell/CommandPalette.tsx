"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  ChefHat,
  Sparkles,
  ClipboardList,
  BookOpen,
  Leaf,
  Smartphone,
  Info,
  ArrowRight,
  Command,
  PlayCircle,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import { useAppContext } from "@/context/AppContext";


interface CommandItem {
  id: string;
  name: string;
  description: string;
  category: "Navigation" | "Actions";
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}


const commands: CommandItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "View kitchen readiness, live stats, and waste telemetry",
    category: "Navigation",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "today",
    name: "Today's Plan",
    description: "Check staged batch cook timings and recommended portions",
    category: "Navigation",
    href: "/today",
    icon: ChefHat,
  },
  {
    id: "forecast",
    name: "Forecast Lab",
    description: "Simulate weather, timetable, and attendance demand scenarios",
    category: "Navigation",
    href: "/forecast",
    icon: Sparkles,
  },
  {
    id: "simulate",
    name: "Simulate Today",
    description: "Split-view rush hour simulation: Guesswork vs PlateWise",
    category: "Navigation",
    href: "/simulate",
    icon: PlayCircle,
  },
  {
    id: "log",
    name: "Log Meals",

    description: "Record preparation pull weight and actual leftover scale numbers",
    category: "Navigation",
    href: "/log",
    icon: ClipboardList,
  },
  {
    id: "menu",
    name: "Menu Planner",
    description: "Weekly mess cyclical menu and seasonal ingredient matrix",
    category: "Navigation",
    href: "/menu",
    icon: BookOpen,
  },
  {
    id: "impact",
    name: "Impact",
    description: "Cost ledger, emission reductions, and zero-waste metrics",
    category: "Navigation",
    href: "/impact",
    icon: Leaf,
  },
  {
    id: "student",
    name: "Student App",
    description: "Crowd meter, digital mess menu, and student meal RSVP",
    category: "Navigation",
    href: "/student",
    icon: Smartphone,
  },
  {
    id: "about",
    name: "About & Credits",
    description: "PlateWise mission, 3D model credits, and Kenney Food Kit attribution",
    category: "Navigation",
    href: "/about",
    icon: Info,
  },
  {
    id: "welcome",
    name: "Interactive Landing Story",
    description: "Explore the 3D procedural bakery kitchen and institutional story",
    category: "Navigation",
    href: "/welcome",
    icon: Info,
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setIsAddMessOpen } = useAppContext();

  const allCommands: CommandItem[] = [
    ...commands,
    {
      id: "action-add-mess",
      name: "Add Dining Hall / Mess",
      description: "Register a new mess hall entity with custom capacity and meal times",
      category: "Actions",
      icon: Plus,
      action: () => setIsAddMessOpen(true),
    },
  ];

  // Filter commands by query
  const filtered = allCommands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Reset selection index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const executeItem = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  // Global keydown for Escape, ArrowUp, ArrowDown, Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeItem(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose, router]);


  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#142814] text-[#FAF6EE] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-amber-500/20 bg-[#0f210f]">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="flex-1 bg-transparent text-sm text-[#FAF6EE] placeholder:text-[#9ab39a] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#1a3a1a] text-amber-300 border border-amber-500/30">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#9ab39a]">
              No pages or actions matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}

                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors",
                    isSelected
                      ? "bg-[#2b5c2b] text-[#faf6ee] font-medium"
                      : "text-[#EDE6D6]/85 hover:bg-[#1f431f]"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected
                          ? "bg-amber-500/25 text-amber-300"
                          : "bg-black/20 text-[#9ab39a]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-medium text-sm text-[#FAF6EE] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[#9ab39a] truncate font-light">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={clsx(
                      "w-4 h-4 shrink-0 transition-opacity",
                      isSelected ? "text-amber-400 opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-amber-500/15 bg-[#0e1d0e] flex items-center justify-between text-[11px] text-[#9ab39a]">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">↵</kbd> to select</span>
          </div>
          <span className="font-mono text-amber-400/80">PlateWise Quick Nav</span>
        </div>
      </div>
    </div>
  );
}
