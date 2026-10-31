"use client";

import { useEffect, useState, useCallback } from "react";

interface HealthData {
  status: string;
  backend?: string;
  database?: string;
  db_host?: string;
  db_driver?: string;
  latency_ms?: number;
  environment?: string;
  version?: string;
  detail?: string;
}

export default function Home() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showRaw, setShowRaw] = useState<boolean>(false);

  // Read backend API URL from environment variable
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const apiUrl = rawApiUrl.replace(/\/+$/, "");
  const healthEndpoint = `${apiUrl}/health`;

  const refreshHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const response = await fetch(healthEndpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setLastChecked(new Date());

      const json = await response.json();

      if (!response.ok) {
        setData(json);
        setError(
          json.detail ||
            `Service returned HTTP ${response.status} (${response.statusText})`
        );
      } else {
        setData(json);
        setError(null);
      }
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setLastChecked(new Date());
      setData(null);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to reach backend server. Please verify the backend container is running.";
      setError(
        `${message} — Failed fetching from ${healthEndpoint}`
      );
    } finally {
      setLoading(false);
    }
  }, [healthEndpoint]);

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      const startTime = performance.now();
      try {
        const response = await fetch(healthEndpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const elapsed = Math.round(performance.now() - startTime);
        const json = await response.json();
        if (!ignore) {
          setLatencyMs(elapsed);
          setLastChecked(new Date());
          if (!response.ok) {
            setData(json);
            setError(json.detail || `Service returned HTTP ${response.status}`);
          } else {
            setData(json);
            setError(null);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const elapsed = Math.round(performance.now() - startTime);
          setLatencyMs(elapsed);
          setLastChecked(new Date());
          setData(null);
          const message =
            err instanceof Error
              ? err.message
              : "Unable to reach backend server. Please verify the backend container is running.";
          setError(`${message} — Failed fetching from ${healthEndpoint}`);
          setLoading(false);
        }
      }
    };

    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [healthEndpoint]);

  // Handle both development (detailed) and production (minimal {"status": "ok"}) responses
  const isHealthy = data?.status === "ok";
  const isBackendOk = isHealthy || data?.backend === "connected";
  const isDatabaseOk = isHealthy || data?.database === "connected";
  const isAllHealthy = isBackendOk && isDatabaseOk;
  const isProd = data?.environment === "production" || (data?.status === "ok" && !data?.environment);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B2E24] flex flex-col font-sans selection:bg-[#D8F3DC] selection:text-[#1B4332]">
      {/* Top Navigation / Brand Bar */}
      <header className="border-b border-[#E7DFD5] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-[#FAF8F5] flex items-center justify-center font-bold text-lg shadow-md border border-[#2D6A4F]">
              🌿
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-[#1B4332]">
                  PlateWise<span className="text-[#D97706]">.ai</span>
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold bg-[#FEF3C7] text-[#92400E] px-2.5 py-0.5 rounded-full border border-[#FCD34D]/60">
                  Walking Skeleton
                </span>
              </div>
              <p className="text-xs text-[#526D5E]">Institutional Food Waste Reduction & Demand Forecasting</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-3 text-xs text-[#526D5E]">
            <span className="inline-flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E7DFD5] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              <span className="font-medium text-[#1B4332]">Next.js 16 + Tailwind</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col justify-center">
        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-[#E7DFD5] shadow-xl p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FEF3C7]/40 to-[#D8F3DC]/40 rounded-bl-full pointer-events-none -z-0"></div>

          <div className="relative z-10">
            {/* Header section with Operational Status and Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#F3EFE6]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#D97706]">
                    Full-Stack Health Probe
                  </span>
                  <span
                    id="overall-status-pill"
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isAllHealthy
                        ? "bg-[#D8F3DC] text-[#1B4332] border border-[#A7F3D0]"
                        : "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                    }`}
                  >
                    {isAllHealthy ? "● All Systems Operational" : "▲ System Degraded"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mt-1.5">
                  System Connectivity Status
                </h1>
                <p className="text-sm text-[#526D5E] mt-1">
                  End-to-end verification of Next.js frontend, FastAPI backend, and PostgreSQL database.
                </p>
              </div>

              <button
                id="refresh-health-btn"
                onClick={() => refreshHealth()}
                disabled={loading}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-medium hover:bg-[#2D6A4F] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0"
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`}
                  style={{ width: "16px", height: "16px", minWidth: "16px", minHeight: "16px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{loading ? "Probing..." : "Refresh Status"}</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                id="health-error-banner"
                className="mt-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm flex items-start space-x-3 shadow-sm"
              >
                <span className="text-lg shrink-0">⚠️</span>
                <div className="flex-1">
                  <div className="font-bold">Connectivity Error</div>
                  <div className="text-xs mt-1 font-mono text-[#7F1D1D] break-all bg-white/60 p-2 rounded border border-[#FCA5A5]">
                    {error}
                  </div>
                  <div className="text-xs text-[#991B1B]/90 mt-2">
                    Ensure the backend container is running on <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-[#7F1D1D]">{apiUrl}</code> and PostgreSQL is healthy.
                  </div>
                </div>
              </div>
            )}

            {/* Status Cards Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Backend Status Card */}
              <div
                id="backend-status-card"
                className={`p-5 rounded-xl border transition-all shadow-sm ${
                  isBackendOk
                    ? "bg-[#EBF7EE] border-[#A7F3D0]"
                    : "bg-[#FEF2F2] border-[#FECACA]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#526D5E]">
                    API Service
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      isBackendOk
                        ? "bg-[#10B981] text-white"
                        : "bg-[#EF4444] text-white"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                    {isBackendOk ? "Backend: connected" : "Backend: disconnected"}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-[#1B4332]">FastAPI Gateway</span>
                  {data?.version && (
                    <span className="text-xs text-[#526D5E] font-mono">v{data.version}</span>
                  )}
                </div>
                <p className="text-xs text-[#526D5E] mt-1.5">
                  CORS restricted to <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-[#E7DFD5]">http://localhost:3000</code>
                </p>
              </div>

              {/* Database Status Card */}
              <div
                id="database-status-card"
                className={`p-5 rounded-xl border transition-all shadow-sm ${
                  isDatabaseOk
                    ? "bg-[#EBF7EE] border-[#A7F3D0]"
                    : "bg-[#FEF2F2] border-[#FECACA]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#526D5E]">
                    Database Layer
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      isDatabaseOk
                        ? "bg-[#10B981] text-white"
                        : "bg-[#EF4444] text-white"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                    {isDatabaseOk ? "Database: connected" : "Database: disconnected"}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-lg font-bold text-[#1B4332]">
                    {data?.db_driver ? `PostgreSQL (${data.db_driver})` : "PostgreSQL Database"}
                  </span>
                  <span className="text-xs text-[#526D5E] font-mono">
                    {data?.db_host || "127.0.0.1:5432"}
                  </span>
                </div>
                <p className="text-xs text-[#526D5E] mt-1.5">
                  Verified via live SQL probe <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-[#E7DFD5]">SELECT 1</code>
                </p>
              </div>
            </div>

            {/* Diagnostic Metadata Grid */}
            <div className="mt-6 pt-6 border-t border-[#F3EFE6] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7DFD5]">
                <span className="text-[#526D5E] block font-semibold">API Endpoint</span>
                <span className="font-mono font-bold text-[#1B4332] truncate block mt-1" title={healthEndpoint}>
                  {healthEndpoint}
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7DFD5]">
                <span className="text-[#526D5E] block font-semibold">Probe Latency</span>
                <span className="font-mono font-bold text-[#D97706] block mt-1">
                  {latencyMs !== null ? `${latencyMs} ms` : "—"}
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7DFD5]">
                <span className="text-[#526D5E] block font-semibold">Environment</span>
                <span className="font-bold text-[#1B4332] block mt-1 capitalize">
                  {data?.environment || (isProd ? "Production" : "Development")}
                </span>
              </div>

              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E7DFD5]">
                <span className="text-[#526D5E] block font-semibold">Last Probed</span>
                <span className="font-mono text-[#526D5E] block mt-1">
                  {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
                </span>
              </div>
            </div>

            {/* Expandable Raw JSON Viewer */}
            <div className="mt-6">
              <button
                id="toggle-raw-json-btn"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] inline-flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <span>{showRaw ? "▾ Hide Diagnostic Payload" : "▸ Inspect Raw Health Payload"}</span>
              </button>

              {showRaw && (
                <pre
                  id="raw-json-payload"
                  className="mt-2.5 p-4 rounded-xl bg-[#0F281E] text-[#D8F3DC] text-xs font-mono overflow-x-auto shadow-inner border border-[#1B4332]"
                >
                  {JSON.stringify(
                    {
                      endpoint: healthEndpoint,
                      timestamp: lastChecked?.toISOString(),
                      probe_latency_ms: latencyMs,
                      response_payload: data,
                      error,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Phase 1 Scaffolding Capabilities Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/90 p-5 rounded-xl border border-[#E7DFD5] shadow-sm hover:border-[#A7F3D0] transition-colors">
            <div className="text-xl">🏢</div>
            <div className="text-sm font-bold text-[#1B4332] mt-2">Multi-Tenancy Mess</div>
            <p className="text-xs text-[#526D5E] mt-1 leading-relaxed">
              Cafeterias, Users, and RBAC roles with strict tenant data isolation.
            </p>
          </div>

          <div className="bg-white/90 p-5 rounded-xl border border-[#E7DFD5] shadow-sm hover:border-[#A7F3D0] transition-colors">
            <div className="text-xl">🍲</div>
            <div className="text-sm font-bold text-[#1B4332] mt-2">Dishes & Meal Logs</div>
            <p className="text-xs text-[#526D5E] mt-1 leading-relaxed">
              Standard serving weights, waste tracking, and carbon impact metrics.
            </p>
          </div>

          <div className="bg-white/90 p-5 rounded-xl border border-[#E7DFD5] shadow-sm hover:border-[#A7F3D0] transition-colors">
            <div className="text-xl">📈</div>
            <div className="text-sm font-bold text-[#1B4332] mt-2">Demand Forecasts</div>
            <p className="text-xs text-[#526D5E] mt-1 leading-relaxed">
              Turnout projections and cold-start baselines ready for ML models.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7DFD5] py-4 text-center text-xs text-[#526D5E]">
        PlateWise AI &copy; 2026 &mdash; Built with FastAPI, Next.js, and PostgreSQL
      </footer>
    </div>
  );
}
