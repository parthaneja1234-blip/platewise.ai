"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";
import DemoDirector from "@/components/DemoDirector";
import { ToastProvider } from "@/components/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-[#FAF8F2] text-[#14211A]">
        {/* 1. Left Collapsible Desktop Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        {/* 2. Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          {/* Top Navigation Bar */}
          <TopBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

          {/* Dynamic Route Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* 3. Mobile Bottom Navigation */}
        <MobileNav />

        {/* 4. Global Cmd+K Command Palette Modal */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
        />

        {/* 5. Demo Director Floating Panel */}
        <DemoDirector />
      </div>
    </ToastProvider>
  );
}


