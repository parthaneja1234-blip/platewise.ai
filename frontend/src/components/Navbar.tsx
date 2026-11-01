"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#122712]/85 backdrop-blur-md border-b border-amber-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-forest-950 font-serif font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-[#FAF6EE]">
              PlateWise <span className="text-amber-400 font-sans text-xs tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 ml-1">AI</span>
            </span>
            <span className="text-[10px] text-[#EDE6D6]/60 tracking-wider uppercase -mt-0.5 font-medium">
              Cafeteria Intelligence
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#EDE6D6]/85">
          <button
            onClick={() => scrollTo("waste-story")}
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            The Waste Story
          </button>
          <button
            onClick={() => scrollTo("waste-story")}
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo("impact")}
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            Impact Model
          </button>
          <button
            onClick={() => scrollTo("credits")}
            className="hover:text-amber-300 transition-colors cursor-pointer"
          >
            3D Credits
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-full bg-forest-900/90 hover:bg-forest-800 text-[#FAF6EE] border border-amber-500/30 text-xs font-semibold tracking-wide transition-all shadow-sm"
          >
            Launch App
          </Link>
          <a
            href="#impact"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 text-xs font-semibold tracking-wide shadow-md transition-all transform hover:-translate-y-0.5"
          >
            Request Pilot
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#EDE6D6] hover:text-amber-300 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#102210] border-b border-amber-500/20 px-6 py-6 flex flex-col gap-4 text-base font-medium text-[#EDE6D6]">
          <button
            onClick={() => scrollTo("waste-story")}
            className="text-left py-2 hover:text-amber-300"
          >
            The Waste Story
          </button>
          <button
            onClick={() => scrollTo("impact")}
            className="text-left py-2 hover:text-amber-300"
          >
            Impact Model
          </button>
          <a
            href="#impact"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-forest-950 font-semibold text-center text-sm"
          >
            Request Pilot
          </a>
        </div>
      )}
    </header>
  );
}
