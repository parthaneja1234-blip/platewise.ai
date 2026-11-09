"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/shell/PageHeader";
import ErrorStateCard from "@/components/shell/ErrorStateCard";
import FoodIcon from "@/components/FoodIcon";
import { useToast } from "@/components/Toast";
import { demoApi, MealLog } from "@/lib/api";
import {
  ClipboardList,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scale,
  Calendar,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  TrendingDown,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { formatKg, formatPercent, formatNumber } from "@/lib/formatters";
import { useAppContext } from "@/context/AppContext";

const DISH_OPTIONS = [
  { id: "roti", name: "Tandoori Roti", category: "bread" },
  { id: "jeera-rice", name: "Jeera Rice", category: "rice" },
  { id: "dal-tadka", name: "Dal Tadka", category: "dal" },
  { id: "paneer-butter-masala", name: "Paneer Butter Masala", category: "curry" },
  { id: "chole-bhature", name: "Chole Bhature", category: "main" },
  { id: "poha", name: "Indori Poha", category: "breakfast" },
  { id: "idli-sambar", name: "Idli Sambar", category: "breakfast" },
  { id: "curd", name: "Fresh Curd", category: "dairy" },
  { id: "salad", name: "Kachumber Salad", category: "side" },
];

export default function LogMealsPage() {
  const { toast } = useToast();
  const { activeMessId, activeMess, refreshMesses } = useAppContext();

  const [logs, setLogs] = useState<MealLog[]>([]);
  const [foodsList, setFoodsList] = useState<any[]>([]);
  const [totalActiveLogs, setTotalActiveLogs] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingLog, setEditingLog] = useState<MealLog | null>(null);
  const [editPrep, setEditPrep] = useState("");
  const [editConsumed, setEditConsumed] = useState("");
  const [editLeftover, setEditLeftover] = useState("");
  const [editTurnout, setEditTurnout] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State
  const [messId, setMessId] = useState(activeMessId);

  useEffect(() => {
    setMessId(activeMessId);
  }, [activeMessId]);

  useEffect(() => {
    demoApi
      .getFoods()
      .then((r) => {
        if (r.foods && r.foods.length > 0) {
          setFoodsList(r.foods);
        }
      })
      .catch(() => {});
  }, []);

  const [date, setDate] = useState("2026-11-02");
  const [meal, setMeal] = useState<"Breakfast" | "Lunch" | "Dinner">("Lunch");
  const [dishId, setDishId] = useState("roti");
  const [preparedKg, setPreparedKg] = useState<string>("75.0");
  const [consumedKg, setConsumedKg] = useState<string>("68.5");
  const [leftoverKg, setLeftoverKg] = useState<string>("6.5");
  const [turnout, setTurnout] = useState<string>("720");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // CSV Upload State
  const [csvUploadOpen, setCsvUploadOpen] = useState<boolean>(false);
  const [csvRows, setCsvRows] = useState<MealLog[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isImportingCsv, setIsImportingCsv] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calc leftover when prepared or consumed change
  const handlePreparedChange = (val: string) => {
    setPreparedKg(val);
    const p = parseFloat(val);
    const c = parseFloat(consumedKg);
    if (!isNaN(p) && !isNaN(c) && p >= c) {
      setLeftoverKg((p - c).toFixed(1));
    }
  };

  const handleConsumedChange = (val: string) => {
    setConsumedKg(val);
    const p = parseFloat(preparedKg);
    const c = parseFloat(val);
    if (!isNaN(p) && !isNaN(c) && p >= c) {
      setLeftoverKg((p - c).toFixed(1));
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await demoApi.getLogs(50);
      setLogs(res.logs || []);
      setTotalActiveLogs(res.total_active_logs || 0);
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setError(err?.message || "Could not retrieve weigh-scale logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pKg = parseFloat(preparedKg);
    const cKg = parseFloat(consumedKg);
    const lKg = parseFloat(leftoverKg);
    const tNum = parseInt(turnout, 10);

    if (isNaN(pKg) || isNaN(cKg) || isNaN(lKg) || isNaN(tNum)) {
      toast({
        type: "error",
        title: "Validation Error",
        description: "Please enter valid numeric values for all weight and headcount fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: MealLog = {
        mess_id: messId,
        date,
        meal,
        dish_id: dishId,
        prepared_kg: pKg,
        consumed_kg: cKg,
        leftover_kg: lKg,
        turnout: tNum,
      };

      const res = await demoApi.postLog(payload);

      // Prepend to local table
      setLogs((prev) => [res.logged_record, ...prev]);
      setTotalActiveLogs(res.total_active_logs);

      toast({
        type: "success",
        title: "Scale Record Saved",
        description: `Logged ${pKg} kg prepared (${lKg} kg leftover) for ${dishId} (${meal} service). Closed-loop engine recalibrated.`,
      });

      // Clear/reset portion fields
      setPreparedKg("");
      setConsumedKg("");
      setLeftoverKg("");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to Record Meal",
        description: err?.message || "Could not submit record to local store.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (l: MealLog) => {
    setEditingLog(l);
    setEditPrep(String(l.prepared_kg));
    setEditConsumed(String(l.consumed_kg));
    setEditLeftover(String(l.leftover_kg));
    setEditTurnout(String(l.turnout));
  };

  const handleSaveEdit = async () => {
    if (!editingLog?.id) return;
    try {
      setIsUpdating(true);
      const p = parseFloat(editPrep);
      const c = parseFloat(editConsumed);
      const left = parseFloat(editLeftover);
      const t = parseInt(editTurnout, 10);
      await demoApi.updateMealLog(editingLog.id, {
        prepared_kg: p,
        consumed_kg: c,
        leftover_kg: left,
        turnout: t,
      });
      toast({
        type: "success",
        title: "Log Updated",
        description: `Service record ${editingLog.id} updated and persisted.`,
      });
      setEditingLog(null);
      await fetchLogs();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Update Failed",
        description: err?.message || "Could not update log record.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLog = async (id?: string) => {
    if (!id) return;
    try {
      await demoApi.deleteMealLog(id);
      toast({
        type: "success",
        title: "Log Deleted",
        description: "Service record removed from persistence.",
      });
      await fetchLogs();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        description: err?.message || "Could not delete log record.",
      });
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      "date,meal,dish_id,prepared_kg,consumed_kg,leftover_kg,turnout\n" +
      "2026-11-02,Lunch,roti,75.0,69.0,6.0,720\n" +
      "2026-11-02,Lunch,jeera-rice,45.0,41.5,3.5,720\n" +
      "2026-11-02,Lunch,dal-tadka,40.0,38.0,2.0,720\n" +
      "2026-11-02,Lunch,paneer-butter-masala,48.0,44.2,3.8,720\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "platewise_weigh_scale_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      type: "info",
      title: "Template Downloaded",
      description: "Downloaded CSV template with required columns: date, meal, dish_id, prepared_kg, consumed_kg, leftover_kg, turnout.",
    });
  };

  // Client-Side CSV File Upload & Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setCsvErrors(["CSV file must contain a header row and at least one data row."]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const expectedHeaders = [
        "date",
        "meal",
        "dish_id",
        "prepared_kg",
        "consumed_kg",
        "leftover_kg",
        "turnout",
      ];

      const missing = expectedHeaders.filter((eh) => !headers.includes(eh));
      if (missing.length > 0) {
        setCsvErrors([`Missing required CSV columns: ${missing.join(", ")}`]);
        return;
      }

      const parsed: MealLog[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, rowIdx) => {
        const cols = line.split(",").map((c) => c.trim());
        if (cols.length < expectedHeaders.length) return;

        const rowObj: any = {};
        headers.forEach((h, i) => {
          rowObj[h] = cols[i];
        });

        const pKg = parseFloat(rowObj.prepared_kg);
        const cKg = parseFloat(rowObj.consumed_kg);
        const lKg = parseFloat(rowObj.leftover_kg);
        const tNum = parseInt(rowObj.turnout, 10);

        if (isNaN(pKg) || isNaN(cKg) || isNaN(lKg) || isNaN(tNum)) {
          errors.push(`Row ${rowIdx + 2}: Non-numeric values in weight or turnout columns.`);
          return;
        }

        parsed.push({
          mess_id: messId,
          date: rowObj.date,
          meal: rowObj.meal as any,
          dish_id: rowObj.dish_id,
          prepared_kg: pKg,
          consumed_kg: cKg,
          leftover_kg: lKg,
          turnout: tNum,
        });
      });

      setCsvErrors(errors);
      setCsvRows(parsed);
      setCsvUploadOpen(true);
    };

    reader.readAsText(file);
  };

  // Batch Import Validated CSV Rows
  const handleBatchImport = async () => {
    if (csvRows.length === 0) return;
    try {
      setIsImportingCsv(true);
      const res = await demoApi.importMealLogs(
        messId,
        csvRows.map((r) => ({
          date: r.date,
          meal: r.meal,
          food_id: r.dish_id,
          prepared_kg: r.prepared_kg,
          consumed_kg: r.consumed_kg,
          leftover_kg: r.leftover_kg,
          turnout: r.turnout,
        }))
      );

      toast({
        type: "success",
        title: "Real Meal Logs Calibrated",
        description: `Successfully imported ${res.imported_count} weigh-scale records. Mess data attributed as "${res.data_label}".`,
      });

      setCsvRows([]);
      setCsvUploadOpen(false);
      await refreshMesses();
      await fetchLogs();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Import Error",
        description: err?.message || "Failed to process batch CSV upload.",
      });
    } finally {
      setIsImportingCsv(false);
    }
  };

  if (error && logs.length === 0) {
    return (
      <ErrorStateCard
        title="Unable to Load Weigh-Scale Ledger"
        message={error}
        onRetry={fetchLogs}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header with Actions */}
      <PageHeader
        title="Log Daily Meal Data"
        subtitle="Weigh-scale closing records and actual leftover telemetry. Closes the prediction feedback loop to continuously sharpen kitchen production accuracy."
        badge="Audit Ledger"
        tabs={[
          { label: "Overview", href: "/dashboard", active: false },
          { label: "Today's Plan", href: "/today", active: false },
          { label: "Plate Studio", href: "/plate-studio", active: false },
          { label: "Log Meals", href: "/log", active: true },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#e3ded0] hover:border-amber-500/40 text-[#14211a] shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Download CSV Template</span>
            </button>
            <label className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-xs transition-all focus-ring flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Weigh-Scale CSV</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        }
      />

      {/* 2. Feedback Loop Banner: Shows How Logs Alter Next Forecast */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0e2412] to-[#1a3a1a] text-[#FAF8F2] border border-amber-500/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">
                Active Logs in Calibration Loop: {totalActiveLogs} Records
              </span>
              <span className={clsx(
                "text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border",
                activeMess?.has_imported_logs
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-400/30"
              )}>
                {activeMess?.data_label || (activeMess?.has_imported_logs ? "College data (imported)" : "Demo data (synthetic)")}
              </span>
            </div>
            <p className="text-[11px] text-[#8fa896] leading-snug mt-0.5">
              Every logged shift recalibrates the Ridge regression residual standard deviation, reducing forecast error variance by up to 0.4% per week.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-forest-950/70 px-3 py-1.5 rounded-xl border border-amber-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Closed-Loop Calibrator: Active</span>
        </div>
      </div>

      {/* 3. CSV Validation Modal / Drawer */}
      {csvUploadOpen && (
        <div className="p-6 rounded-2xl bg-white border-2 border-amber-500/40 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#14211a]">
                Weigh-Scale CSV Validation Preview
              </h3>
              <p className="text-xs text-[#728479]">
                Verified {csvRows.length} valid row(s) ready for kitchen batch ledger.
              </p>
            </div>
            <button
              onClick={() => {
                setCsvUploadOpen(false);
                setCsvRows([]);
                setCsvErrors([]);
              }}
              className="p-1 rounded-lg text-[#728479] hover:text-[#14211a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {csvErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Validation Issues Found:</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {csvErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {csvRows.length > 0 && (
            <div className="overflow-x-auto max-h-60 border border-[#e3ded0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F2] border-b border-[#e3ded0] text-[#728479]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Meal</th>
                    <th className="p-2.5">Dish</th>
                    <th className="p-2.5 text-right">Prepared</th>
                    <th className="p-2.5 text-right">Consumed</th>
                    <th className="p-2.5 text-right">Leftover</th>
                    <th className="p-2.5 text-right">Turnout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3ded0]/60">
                  {csvRows.slice(0, 8).map((row, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.02]">
                      <td className="p-2.5 font-mono">{row.date}</td>
                      <td className="p-2.5">{row.meal}</td>
                      <td className="p-2.5 font-semibold text-[#14211a]">
                        {row.dish_id}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        {row.prepared_kg} kg
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        {row.consumed_kg} kg
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#c8553d] font-bold">
                        {row.leftover_kg} kg
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        {row.turnout}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCsvUploadOpen(false);
                setCsvRows([]);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#e3ded0] hover:bg-[#FAF8F2] text-[#4a5a50]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBatchImport}
              disabled={isImportingCsv || csvRows.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0e2412] hover:bg-forest-900 text-[#FAF8F2] shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isImportingCsv ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import {csvRows.length} Validated Records</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Split Grid: Left 5 Cols (Keyboard-First Scale Form) vs Right 7 Cols (Recent Logs Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Keyboard-First Form */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
            <div>
              <h2 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-700" />
                Station Weigh-Scale Entry
              </h2>
              <p className="text-xs text-[#728479]">
                Keyboard-first: Tab through fields and press Enter to record.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Row 1: Date & Meal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#14211a]">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#14211a]">Meal Shift</label>
                <select
                  value={meal}
                  onChange={(e) => setMeal(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring text-xs font-semibold cursor-pointer"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>
            </div>

            {/* Row 2: Dish Selector */}
            <div className="space-y-1">
              <label className="font-bold text-[#14211a]">Dish Recipe</label>
              <select
                value={dishId}
                onChange={(e) => setDishId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring text-xs font-semibold cursor-pointer"
              >
                {(foodsList.length > 0 ? foodsList : DISH_OPTIONS).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Prepared Kg vs Consumed Kg */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#14211a]">
                  Opening Prepared (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2000"
                  placeholder="e.g. 75.0"
                  value={preparedKg}
                  onChange={(e) => handlePreparedChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring font-mono text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#14211a]">
                  Consumed Eaten (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2000"
                  placeholder="e.g. 68.5"
                  value={consumedKg}
                  onChange={(e) => handleConsumedChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring font-mono text-xs font-bold"
                />
              </div>
            </div>

            {/* Row 4: Leftover Kg & Actual Turnout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-[#c8553d]">
                  Leftover Scraps (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2000"
                  placeholder="e.g. 6.5"
                  value={leftoverKg}
                  onChange={(e) => setLeftoverKg(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-300 focus-ring font-mono text-xs font-bold text-[#c8553d]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#14211a]">
                  Actual Turnout (Headcount)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="e.g. 720"
                  value={turnout}
                  onChange={(e) => setTurnout(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F2] border border-[#e3ded0] focus-ring font-mono text-xs font-bold"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-sans text-xs font-bold bg-[#0e2412] hover:bg-forest-900 text-[#FAF8F2] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus-ring disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Recording Log Entry...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Record Weigh-Scale Entry [Enter]</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Recent Logs Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#e3ded0] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e3ded0] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#14211a] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-700" />
                Recent Kitchen Service Logs ({logs.length})
              </h3>
              <p className="text-xs text-[#728479]">
                Weigh-scale records feeding closed-loop regression variance.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#728479] hover:text-[#14211a] transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e3ded0] text-[#728479] font-medium">
                <tr>
                  <th className="pb-2.5">Date & Meal</th>
                  <th className="pb-2.5">Dish</th>
                  <th className="pb-2.5 text-right">Prepared</th>
                  <th className="pb-2.5 text-right">Consumed</th>
                  <th className="pb-2.5 text-right">Leftover</th>
                  <th className="pb-2.5 text-right">Waste %</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3ded0]/60">
                {logs.slice(0, 15).map((log, idx) => {
                  const prep = log.prepared_kg ?? 0;
                  const leftover = log.leftover_kg ?? 0;
                  const wastePctNum = prep > 0 ? (leftover / prep) * 100 : 0;
                  return (
                    <tr key={log.id || idx} className="hover:bg-black/[0.02]">
                      <td className="py-2.5">
                        <div className="font-mono text-xs font-semibold text-[#14211a]">
                          {log.date}
                        </div>
                        <div className="text-[10px] text-[#728479]">{log.meal}</div>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <FoodIcon dishId={log.dish_id} size="sm" />
                          <span className="font-semibold text-[#14211a] capitalize">
                            {log.dish_id.replace(/-/g, " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#14211a]">
                        {formatKg(log.prepared_kg, 1)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#728479]">
                        {formatKg(log.consumed_kg, 1)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#c8553d]">
                        {formatKg(log.leftover_kg, 1)}
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            wastePctNum > 15
                              ? "bg-rose-500/15 text-rose-800"
                              : "bg-emerald-500/15 text-emerald-800"
                          )}
                        >
                          {formatPercent(wastePctNum, 1)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(log)}
                            title="Edit this service record"
                            className="p-1 rounded hover:bg-black/5 text-[#728479] hover:text-[#14211a] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {log.id && !log.is_synthetic_seed && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              title="Delete this service record"
                              className="p-1 rounded hover:bg-rose-50 text-[#728479] hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-[#FAF8F2] border border-[#e3ded0] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#14211a] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e3ded0]">
              <div className="flex items-center gap-2">
                <FoodIcon dishId={editingLog.dish_id} size="sm" />
                <div>
                  <h3 className="font-serif font-bold text-base">
                    Edit Service Log: {editingLog.dish_id.replace(/-/g, " ").toUpperCase()}
                  </h3>
                  <div className="text-[11px] text-[#728479]">
                    {editingLog.date} &middot; {editingLog.meal}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-lg hover:bg-black/5 text-[#728479]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#14211a] block mb-1">Prepared Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editPrep}
                  onChange={(e) => {
                    setEditPrep(e.target.value);
                    const p = parseFloat(e.target.value);
                    const c = parseFloat(editConsumed);
                    if (!isNaN(p) && !isNaN(c) && p >= c) {
                      setEditLeftover((p - c).toFixed(1));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e3ded0] font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#14211a] block mb-1">Consumed Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editConsumed}
                  onChange={(e) => {
                    setEditConsumed(e.target.value);
                    const p = parseFloat(editPrep);
                    const c = parseFloat(e.target.value);
                    if (!isNaN(p) && !isNaN(c) && p >= c) {
                      setEditLeftover((p - c).toFixed(1));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e3ded0] font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#c8553d] block mb-1">Leftover Scraps (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editLeftover}
                  onChange={(e) => setEditLeftover(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-300 font-mono text-xs font-bold text-[#c8553d]"
                />
              </div>

              <div>
                <label className="font-bold text-[#14211a] block mb-1">Diner Attendance (Headcount)</label>
                <input
                  type="number"
                  value={editTurnout}
                  onChange={(e) => setEditTurnout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e3ded0] font-mono text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e3ded0]">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#728479] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a3a1a] hover:bg-[#254f25] text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUpdating ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
