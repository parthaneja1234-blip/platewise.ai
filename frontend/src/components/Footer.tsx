"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0d1e0d] border-t border-amber-500/15 text-[#EDE6D6]/70 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Brand column */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-forest-950 font-serif font-black text-lg shadow-md">
              P
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF6EE]">
              PlateWise <span className="text-amber-400 font-sans text-xs uppercase tracking-wider font-semibold">AI</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#EDE6D6]/75 font-light leading-relaxed max-w-sm mb-6">
            Institutional food waste intelligence & automated demand forecasting
            engineered for university mess halls, college hostels, and corporate dining.
          </p>
          <div className="text-[11px] text-[#EDE6D6]/50">
            Compliant with OWASP ASVS v4.0.3 Security & Role-Based Tenancy Isolation.
          </div>
        </div>

        {/* Links column */}
        <div className="md:col-span-3">
          <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-4">
            Platform Capabilities
          </h4>
          <ul className="space-y-2.5 text-xs text-[#EDE6D6]/80 font-light">
            <li>Bayesian Demand Forecasting</li>
            <li>Real-Time Batch Cook Scheduling</li>
            <li>Perishable Ingredient Lifespan Optimizer</li>
            <li>Carbon & Cost Savings Audit Ledger</li>
          </ul>
        </div>

        {/* Institutional Contact */}
        <div className="md:col-span-4">
          <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-4">
            Campus Dining Pilots
          </h4>
          <p className="text-xs text-[#EDE6D6]/75 leading-relaxed mb-4">
            Currently accepting 3 university dining hall pilot partnerships for the upcoming
            academic semester.
          </p>
          <div className="p-3.5 rounded-xl bg-[#132813] border border-amber-500/20 text-xs text-amber-300/90 font-mono">
            pilot@platewise.ai
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 mt-12 border-t border-cream-200/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EDE6D6]/50 gap-4">
        <div>
          © 2026 PlateWise AI. All rights reserved.
        </div>

        <div className="flex items-center gap-6">
          <a href="#credits" className="hover:text-amber-400 transition-colors">
            3D Credits (CC0)
          </a>
          <span>Security Verified</span>
          <span>Zero Open Registration</span>
          <span>Self-Hosted & Cloud</span>
        </div>
      </div>
    </footer>
  );
}
