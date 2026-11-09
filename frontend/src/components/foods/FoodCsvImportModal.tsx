"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { demoApi } from "@/lib/api";

interface FoodCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FoodCsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: FoodCsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Limit: 1 MB
    if (selectedFile.size > 1024 * 1024) {
      setParseError("File exceeds 1 MB maximum limit.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setPreviewResult(null);

    // Read and parse CSV text
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setParsing(true);
        const text = event.target?.result as string;
        const rows = parseCsvText(text);

        if (rows.length === 0) {
          setParseError("The CSV file is empty or contains no data rows.");
          return;
        }

        if (rows.length > 500) {
          setParseError(`CSV contains ${rows.length} rows, which exceeds the 500 rows maximum limit.`);
          return;
        }

        setParsedRows(rows);

        // Run server-side dry-run preview with Pydantic validation and cross-checks
        const res = await demoApi.importFoods(rows, true);
        setPreviewResult(res);
      } catch (err: any) {
        setParseError(err?.message || "Failed to parse CSV file.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseCsvText = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // RFC-compliant CSV split
      const tokens: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          tokens.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      tokens.push(current.trim().replace(/^["']|["']$/g, ""));

      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = tokens[idx] !== undefined ? tokens[idx] : "";
        rowObj[h] = val;
      });

      if (rowObj.id || rowObj.name) {
        rows.push(rowObj);
      }
    }
    return rows;
  };

  const handleConfirmImport = async () => {
    if (!parsedRows.length) return;
    try {
      setImporting(true);
      await demoApi.importFoods(parsedRows, false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setParseError(err?.message || "Failed to commit imported food catalog.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#142314] border border-emerald-500/25 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between bg-[#111c11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#faf8f2]">
                Import Foods Catalogue CSV
              </h2>
              <p className="text-[11px] text-[#8fa896]">
                Preview creates vs updates, cross-check warnings, and upsert by dish ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8fa896] hover:text-[#faf8f2] hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-[#e5dccb]">
          {/* File Picker & Limits Guidance */}
          <div className="p-5 rounded-xl border border-dashed border-emerald-500/30 bg-[#172717] text-center hover:border-emerald-400/50 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm text-[#faf8f2] mb-1">
              {file ? file.name : "Select or drag CSV file to preview"}
            </p>
            <p className="text-[11px] text-[#8fa896] mb-3">
              Strict limits: <strong>Max 1 MB</strong> file size, <strong>Max 500 rows</strong>.
              Columns supported: <code>id, name, category, veg, unit_label, serving_weight_g, kcal_per_100g, kcal_per_serving, protein_g, carbs_g, fat_g, fiber_g, cost_inr_per_serving, source_type, source_note, measured_on, verified, model_id, icon_id, max_per_plate</code>
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse CSV File</span>
            </button>
          </div>

          {/* Parse or Validation Error */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-100">Validation Error: </span>
                {parseError}
              </div>
            </div>
          )}

          {parsing && (
            <div className="py-8 text-center text-[#8fa896]">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Running dry-run preview and cross-checks validation...
            </div>
          )}

          {/* Dry Run Preview Summary Strip */}
          {previewResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-xl bg-[#111c11] border border-emerald-500/20">
                  <div className="text-[10px] text-[#8fa896] uppercase">Total Rows</div>
                  <div className="text-lg font-mono font-bold text-[#faf8f2]">
                    {previewResult.total_rows}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 uppercase">Will Create</div>
                  <div className="text-lg font-mono font-bold text-emerald-300">
                    +{previewResult.created_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                  <div className="text-[10px] text-blue-400 uppercase">Will Update</div>
                  <div className="text-lg font-mono font-bold text-blue-300">
                    {previewResult.updated_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                  <div className="text-[10px] text-amber-400 uppercase">Cross-Check Warnings</div>
                  <div className="text-lg font-mono font-bold text-amber-300">
                    {previewResult.warnings_count}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <div className="text-[10px] text-rose-400 uppercase">Per-Row Errors</div>
                  <div className="text-lg font-mono font-bold text-rose-300">
                    {previewResult.errors?.length || 0}
                  </div>
                </div>
              </div>

              {/* Error messages if any */}
              {previewResult.errors?.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 text-rose-200">
                  <div className="font-semibold text-rose-300 flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Row Validation Errors (must resolve before saving):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {previewResult.errors.map((e: any, idx: number) => (
                      <li key={idx}>
                        Row {e.row_index} ({e.id || "unnamed"}): {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cross-Checks Warnings Summary */}
              {previewResult.warnings_count > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Cross-Checks Triggered ({previewResult.warnings_count} warnings):</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Some rows deviate from standard biological or nutritional consistency (e.g. macro energy divergence &gt;20%, 100g vs serving divergence &gt;15%, or portion weight bounds). Review the highlighted items in the preview table below.
                  </p>
                </div>
              )}

              {/* Preview Table */}
              <div className="rounded-xl border border-emerald-500/20 overflow-hidden bg-[#111c11]">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#182818] text-[#8fa896] uppercase tracking-wider text-[10px] sticky top-0 border-b border-emerald-500/20">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Food ID & Name</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3 font-mono">Weight (g)</th>
                        <th className="py-2.5 px-3 font-mono">kcal</th>
                        <th className="py-2.5 px-3">Warnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10">
                      {previewResult.items?.map((it: any) => (
                        <tr key={it.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 text-[#8fa896] font-mono">{it.row_index}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                it.action === "create"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {it.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-[#faf8f2]">
                            <div>{it.name}</div>
                            <div className="text-[10px] text-[#8fa896] font-mono">{it.id}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] capitalize text-[#faf8f2]">
                              {it.source_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-300">{it.serving_weight_g}g</td>
                          <td className="py-2 px-3 font-mono text-[#faf8f2]">{it.kcal_per_serving}</td>
                          <td className="py-2 px-3">
                            {it.warnings?.length > 0 ? (
                              <span
                                className="text-[10px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 inline-block truncate max-w-[220px]"
                                title={it.warnings.join("\n")}
                              >
                                ⚠ {it.warnings[0]}
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-[10px]">✓ Clean</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-emerald-500/20 bg-[#111c11] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[#8fa896] hover:text-[#faf8f2] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !previewResult ||
              (previewResult.errors && previewResult.errors.length > 0) ||
              importing
            }
            onClick={handleConfirmImport}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {importing ? (
              <span>Saving Records...</span>
            ) : (
              <>
                <span>Commit & Upsert ({previewResult?.valid_rows || 0} items)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
