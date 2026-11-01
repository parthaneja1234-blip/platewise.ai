"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Mock trend data for waste reduction
const wasteTrendData = [
  { month: "Aug", baseline: 920, platewise: 630 },
  { month: "Sep", baseline: 950, platewise: 640 },
  { month: "Oct", baseline: 1020, platewise: 690 },
  { month: "Nov", baseline: 980, platewise: 660 },
  { month: "Dec", baseline: 880, platewise: 590 },
  { month: "Jan", baseline: 990, platewise: 670 },
];

// Mock monthly procurement savings data (in Thousands of INR)
const costSavingsData = [
  { month: "Aug", savings: 95 },
  { month: "Sep", savings: 110 },
  { month: "Oct", savings: 135 },
  { month: "Nov", savings: 125 },
  { month: "Dec", savings: 90 },
  { month: "Jan", savings: 130 },
];

// Mock emission diversion sources
const emissionBreakdown = [
  { name: "Methane Avoided (Landfill)", value: 65, color: "#10b981" },
  { name: "Supply Chain Transport", value: 20, color: "#f59e0b" },
  { name: "Cold Storage Energy", value: 15, color: "#3b82f6" },
];

export default function ImpactSection() {
  return (
    <section
      id="impact"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-[#162e16] text-[#FAF6EE] overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 border border-amber-500/25 text-amber-300 text-xs font-medium tracking-wider uppercase mb-4">
            Institutional Impact
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-[#FAF6EE] mb-6">
            Real savings for cafeterias. <br />
            <span className="italic font-serif text-amber-400">
              Tangible dividends for the planet.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#EDE6D6]/80 font-light leading-relaxed">
            Every metric below reflects verified institutional modeling for a standard
            1,200-student university hostel dining facility over one full academic year.
          </p>
        </div>

        {/* 3 Animated Impact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Less Waste */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                  01. Waste Diverted
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Illustrative Model
                </span>
              </div>

              <div className="font-serif text-4xl sm:text-5xl font-bold text-amber-400 mb-2">
                -32%
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-2">
                Less Kitchen & Plate Waste
              </h3>
              <p className="text-sm text-[#EDE6D6]/75 font-light leading-relaxed mb-6">
                Reduces total preparation surplus and cafeteria scraping from an average of
                260 kg/day down to 175 kg/day.
              </p>

              {/* Mini Trend AreaChart */}
              <div className="w-full h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wasteTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f230f",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#FAF6EE",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      name="Baseline (kg)"
                      stroke="#d97706"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="url(#wasteGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="platewise"
                      name="PlateWise (kg)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fill="url(#optGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200/10 flex items-center justify-between text-xs text-[#EDE6D6]/70">
              <span>Annual Food Saved:</span>
              <strong className="text-[#FAF6EE] font-serif text-sm">8.4 Metric Tons</strong>
            </div>
          </motion.div>

          {/* Card 2: Lower Costs */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
                  02. Financial Savings
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Illustrative Model
                </span>
              </div>

              <div className="font-serif text-4xl sm:text-5xl font-bold text-[#FAF6EE] mb-2">
                ₹14.2 L
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-2">
                Annual Procurement Savings
              </h3>
              <p className="text-sm text-[#EDE6D6]/75 font-light leading-relaxed mb-6">
                Direct raw material savings calculated at ₹45/kg standard university mess
                ingredient benchmark.
              </p>

              {/* Mini BarChart */}
              <div className="w-full h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costSavingsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val || 0) * 1000}`, "Monthly Savings"]}
                      contentStyle={{
                        backgroundColor: "#0f230f",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#FAF6EE",
                      }}
                    />
                    <Bar
                      dataKey="savings"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200/10 flex items-center justify-between text-xs text-[#EDE6D6]/70">
              <span>Per Student / Year:</span>
              <strong className="text-amber-300 font-serif text-sm">₹1,180 Saved</strong>
            </div>
          </motion.div>

          {/* Card 3: Fewer Emissions */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-8 rounded-3xl bg-[#132913]/90 border border-amber-500/20 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                  03. Decarbonization
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Illustrative Model
                </span>
              </div>

              <div className="font-serif text-4xl sm:text-5xl font-bold text-emerald-400 mb-2">
                21.0 MT
              </div>
              <h3 className="font-serif text-xl font-semibold text-[#FAF6EE] mb-2">
                CO₂e Emissions Prevented
              </h3>
              <p className="text-sm text-[#EDE6D6]/75 font-light leading-relaxed mb-6">
                Based on IPCC/FAO 2.5 kg CO₂e multiplier per kilogram of organic waste diverted
                from methane-generating landfills.
              </p>

              {/* Mini Pie / Donut Chart */}
              <div className="w-full h-44 mb-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emissionBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {emissionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Contribution"]}
                      contentStyle={{
                        backgroundColor: "#0f230f",
                        border: "1px solid rgba(16,185,129,0.3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#FAF6EE",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200/10 flex items-center justify-between text-xs text-[#EDE6D6]/70">
              <span>Equivalence:</span>
              <strong className="text-emerald-400 font-serif text-sm">4.6 Passenger Cars Off Road</strong>
            </div>
          </motion.div>
        </div>

        {/* Mandatory Transparency Note */}
        <div className="mt-12 text-center text-xs text-[#EDE6D6]/50 max-w-2xl mx-auto">
          * All metrics depicted are illustrative projections derived from PlateWise AI’s Phase 1
          calibrated institutional mess baseline (₹45/kg raw cost, 2.5 kg CO₂e/kg IPCC factor, 1,200 daily meals).
        </div>
      </div>
    </section>
  );
}
