"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  Activity,
  Sliders,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import CardErrorBoundary from "@/components/CardErrorBoundary";
import { formatINR, formatNumber } from "@/lib/formatters";

interface AdminMessItem {
  id: string;
  name: string;
  campus_location: string;
  is_demo: boolean;
  cost_per_kg_inr: number;
  co2e_factor_kg_per_kg: number;
  manager_count: number;
  student_count: number;
}

export default function AdminConsolePage() {
  const { user } = useAuth();
  const { messes, activeMess, setIsAddMessOpen } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "messes" | "users" | "audit">("overview");

  const [messesList, setMessesList] = useState<AdminMessItem[]>([
    {
      id: "mess-boys-a",
      name: "Boys Hostel Mess A",
      campus_location: "Hostel Zone 1",
      is_demo: true,
      cost_per_kg_inr: 45,
      co2e_factor_kg_per_kg: 2.5,
      manager_count: 2,
      student_count: 420,
    },
    {
      id: "mess-girls-b",
      name: "Girls Hostel Mess B",
      campus_location: "Hostel Zone 2",
      is_demo: true,
      cost_per_kg_inr: 48,
      co2e_factor_kg_per_kg: 2.5,
      manager_count: 1,
      student_count: 380,
    },
    {
      id: "mess-central-dining",
      name: "North Campus Central Dining",
      campus_location: "Central Academic Complex",
      is_demo: true,
      cost_per_kg_inr: 42,
      co2e_factor_kg_per_kg: 2.5,
      manager_count: 3,
      student_count: 850,
    },
  ]);

  const [usersList] = useState([
    {
      id: "usr-admin-1",
      email: "partyhaneja1234@gmail.com",
      full_name: "Platform Administrator",
      role: "admin",
      is_active: true,
    },
    {
      id: "usr-mgr-1",
      email: "chef.ramesh@university.edu",
      full_name: "Ramesh Sharma",
      role: "mess_manager",
      is_active: true,
    },
    {
      id: "usr-std-1",
      email: "aarav.sharma@university.edu",
      full_name: "Aarav Sharma",
      role: "student",
      is_active: true,
    },
  ]);

  const [auditLogs] = useState([
    {
      id: "aud-1",
      time: "Just now",
      action: "LOGIN_SUCCESS",
      user: "partyhaneja1234@gmail.com",
      ip: "127.0.0.1",
      details: "Admin session authenticated",
    },
    {
      id: "aud-2",
      time: "10 mins ago",
      action: "BATCH_CALIBRATION_COMPUTED",
      user: "System Machine Learning",
      ip: "Internal",
      details: "Lunch shift 18 kg surplus saved",
    },
    {
      id: "aud-3",
      time: "1 hour ago",
      action: "SCHEMA_MIGRATION_CONFIRMED",
      user: "System Administrator",
      ip: "127.0.0.1",
      details: "Alembic phase 3 student role & join codes",
    },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Header with Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3ded0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Platform Administration
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#14211a]">
            System Admin Console
          </h1>
          <p className="text-xs text-[#728479] mt-1 max-w-2xl">
            Multi-cafeteria provisioning, campus manager delegations, audit verification, and global forecasting constants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddMessOpen(true)}
            id="admin-add-mess-btn"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Mess</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#e3ded0] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-[#0e2412] text-[#FAF8F2] shadow-xs"
              : "text-[#728479] hover:text-[#14211a] hover:bg-forest-950/5"
          }`}
        >
          System Overview
        </button>
        <button
          onClick={() => setActiveTab("messes")}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "messes"
              ? "bg-[#0e2412] text-[#FAF8F2] shadow-xs"
              : "text-[#728479] hover:text-[#14211a] hover:bg-forest-950/5"
          }`}
        >
          Cafeterias ({messesList.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-[#0e2412] text-[#FAF8F2] shadow-xs"
              : "text-[#728479] hover:text-[#14211a] hover:bg-forest-950/5"
          }`}
        >
          Staff & Roles ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#0e2412] text-[#FAF8F2] shadow-xs"
              : "text-[#728479] hover:text-[#14211a] hover:bg-forest-950/5"
          }`}
        >
          Audit Ledger ({auditLogs.length})
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <CardErrorBoundary cardTitle="Total Messes" compact>
          <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-[#728479]">
              <span>Managed Messes</span>
              <Building2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#14211a]">
              {messesList.length} Facilities
            </div>
            <div className="text-[10px] text-emerald-700">100% operational</div>
          </div>
        </CardErrorBoundary>

        <CardErrorBoundary cardTitle="Active Students" compact>
          <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-[#728479]">
              <span>Active Diners</span>
              <Users className="w-4 h-4 text-amber-700" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#14211a]">
              {formatNumber(messesList.reduce((acc, m) => acc + m.student_count, 0))}
            </div>
            <div className="text-[10px] text-amber-800">Across 3 hostel zones</div>
          </div>
        </CardErrorBoundary>

        <CardErrorBoundary cardTitle="System Health" compact>
          <div className="p-4 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-[#728479]">
              <span>System Health</span>
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-serif text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Optimal</span>
            </div>
            <div className="text-[10px] text-[#728479]">Ridge model MAPE: 8.06%</div>
          </div>
        </CardErrorBoundary>

        <CardErrorBoundary cardTitle="Active Administrator" compact>
          <div className="p-4 rounded-2xl bg-[#0e2412] text-[#FAF8F2] border border-amber-500/30 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span>Admin Account</span>
              <Lock className="w-4 h-4" />
            </div>
            <div className="font-mono text-xs font-bold text-white truncate">
              {user?.email || "partyhaneja1234@gmail.com"}
            </div>
            <div className="text-[10px] text-emerald-300 font-sans">Role: Super Admin</div>
          </div>
        </CardErrorBoundary>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Managed Messes Table (8 cols) */}
          <div className="lg:col-span-8">
            <CardErrorBoundary cardTitle="Campus Dining Facilities">
              <div className="bg-white rounded-2xl border border-[#e3ded0] shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
                  <h3 className="font-serif text-base font-bold text-[#14211a]">
                    Campus Dining Facilities
                  </h3>
                  <span className="text-xs text-[#728479]">
                    {messesList.length} Active Cafeterias
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e3ded0] text-[#728479] uppercase font-mono text-[10px]">
                        <th className="pb-2">Mess Name</th>
                        <th className="pb-2">Campus Zone</th>
                        <th className="pb-2 text-right">Cost / kg</th>
                        <th className="pb-2 text-right">Active Diners</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3ded0]/60">
                      {messesList.map((m) => (
                        <tr key={m.id} className="hover:bg-forest-950/[0.02]">
                          <td className="py-3 font-semibold text-[#14211a] flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-700" />
                            <span>{m.name}</span>
                          </td>
                          <td className="py-3 text-[#728479]">{m.campus_location}</td>
                          <td className="py-3 text-right font-mono text-[#14211a]">
                            {formatINR(m.cost_per_kg_inr)}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-[#14211a]">
                            {m.student_count}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardErrorBoundary>
          </div>

          {/* Platform Model Assumptions (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <CardErrorBoundary cardTitle="Economic & Carbon Constants">
              <div className="bg-white rounded-2xl border border-[#e3ded0] shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
                  <h3 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <span>Global Constants</span>
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-[#e3ded0]">
                    <span className="text-[#728479]">Baseline Food Cost:</span>
                    <span className="font-mono font-bold text-[#14211a]">₹45 / kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#e3ded0]">
                    <span className="text-[#728479]">IPCC Landfill Factor:</span>
                    <span className="font-mono font-bold text-teal-800">2.5 kg CO2e / kg</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#e3ded0]">
                    <span className="text-[#728479]">Waste Target Cut:</span>
                    <span className="font-mono font-bold text-emerald-700">-72% Target</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#728479]">Confidence Horizon:</span>
                    <span className="font-mono font-bold text-amber-800">p10 - p90 (80%)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-forest-950/[0.03] border border-[#e3ded0] text-[11px] text-[#728479]">
                  Institutional multipliers calibrated with ISO 14064 greenhouse gas reporting standards.
                </div>
              </div>
            </CardErrorBoundary>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-[#0e2412] to-[#1a3a1a] text-[#FAF8F2] rounded-2xl p-5 border border-amber-500/30 shadow-md space-y-3">
              <div className="font-serif text-sm font-bold text-amber-300">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link
                  href="/dashboard"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-center text-white"
                >
                  Mess Operations
                </Link>
                <Link
                  href="/today"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-center text-white"
                >
                  Today&apos;s Cook Sheet
                </Link>
                <Link
                  href="/student"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-center text-white"
                >
                  Student Mobile View
                </Link>
                <Link
                  href="/settings"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-center text-white"
                >
                  Join Codes
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "messes" && (
        <CardErrorBoundary cardTitle="All Campus Facilities">
          <div className="bg-white rounded-2xl border border-[#e3ded0] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#14211a]">
                All University Dining Facilities
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMessOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0e2412] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-forest-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Provision Facility
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {messesList.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-[#e3ded0] bg-[#FAF8F2] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#14211a]">{m.name}</div>
                      <div className="text-xs text-[#728479]">{m.campus_location}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30">
                      Live
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#e3ded0]">
                    <div>
                      <div className="text-[10px] text-[#728479]">Managers</div>
                      <div className="font-bold">{m.manager_count} Assigned</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#728479]">Diners</div>
                      <div className="font-bold">{m.student_count} Students</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardErrorBoundary>
      )}

      {activeTab === "users" && (
        <CardErrorBoundary cardTitle="Staff & Role Directory">
          <div className="bg-white rounded-2xl border border-[#e3ded0] shadow-xs p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#14211a] border-b border-[#e3ded0] pb-3">
              Staff & User Directory
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e3ded0] text-[#728479] uppercase font-mono text-[10px]">
                    <th className="pb-2">Full Name</th>
                    <th className="pb-2">Email Address</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ded0]/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-forest-950/[0.02]">
                      <td className="py-3 font-semibold text-[#14211a]">{u.full_name}</td>
                      <td className="py-3 font-mono text-[#728479]">{u.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-900 border border-amber-500/30 font-semibold">
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-emerald-700 font-semibold">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardErrorBoundary>
      )}

      {activeTab === "audit" && (
        <CardErrorBoundary cardTitle="Append-Only Audit Ledger">
          <div className="bg-white rounded-2xl border border-[#e3ded0] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#14211a]">
                  Append-Only Security Audit Ledger
                </h3>
                <p className="text-xs text-[#728479]">
                  Cryptographically immutable security events and model execution tracking.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#0e2412] text-white">
                OWASP ASVS V3.4
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-forest-950/[0.02] border border-[#e3ded0] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-[#14211a]">{log.action}</span>
                    <span className="text-[#728479] text-[11px]">by {log.user}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#728479]">
                    <span>{log.details}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-[#e3ded0] text-[#14211a]">
                      {log.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardErrorBoundary>
      )}
    </div>
  );
}
