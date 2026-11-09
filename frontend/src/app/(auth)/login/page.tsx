"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, enterDemoMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || "Invalid email or password. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E2412] text-[#FAF8F2] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#1B4D2E]/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/20 blur-[140px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#16381E]/80 backdrop-blur-xl border border-[#2D5A38] rounded-2xl p-8 shadow-2xl z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D5A38] to-[#1B4D2E] border border-[#3E7B4C] mb-4 shadow-lg shadow-black/20">
            <span className="text-2xl">🌱</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F2]">
            PlateWise AI
          </h1>
          <p className="text-sm text-[#A3B899] mt-1">
            Institutional Food Waste Intelligence & Demand Forecasting
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-700/60 text-red-200 text-sm flex items-start space-x-3">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email-input"
              className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider mb-2"
            >
              Institutional Email
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@university.edu"
              className="w-full px-4 py-3 rounded-xl bg-[#0E2412]/80 border border-[#2D5A38] text-[#FAF8F2] placeholder-[#5A7A60] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-base min-h-[44px]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-[#A3B899] uppercase tracking-wider"
              >
                Password
              </label>
            </div>
            <input
              id="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#0E2412]/80 border border-[#2D5A38] text-[#FAF8F2] placeholder-[#5A7A60] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-base min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="login-submit-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C19B26] hover:from-[#E5BF48] hover:to-[#D4AF37] text-[#0E2412] font-bold text-base shadow-lg shadow-black/20 hover:shadow-black/40 active:scale-[0.99] transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-[#0E2412] border-t-transparent rounded-full animate-spin" />
                <span>Signing in…</span>
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Join code registration link for students */}
        <div className="mt-6 pt-6 border-t border-[#2D5A38]/50 text-center">
          <p className="text-sm text-[#A3B899]">
            Student with a dining join code?{" "}
            <Link
              href="/register"
              id="student-join-link"
              className="font-semibold text-[#D4AF37] hover:underline cursor-pointer"
            >
              Register here
            </Link>
          </p>
        </div>

        {/* Public Demo Fallback Path */}
        <div className="mt-4 text-center">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#2D5A38]/40"></div>
            <span className="flex-shrink mx-3 text-xs text-[#5A7A60] uppercase tracking-wider">
              or explore freely
            </span>
            <div className="flex-grow border-t border-[#2D5A38]/40"></div>
          </div>
          <button
            type="button"
            onClick={enterDemoMode}
            id="try-demo-btn"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1B4D2E]/60 hover:bg-[#1B4D2E] border border-[#2D5A38] text-[#FAF8F2] text-sm font-semibold transition-all min-h-[44px] cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>✨</span>
            <span>Try the Interactive Demo</span>
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="mt-8 text-center text-xs text-[#5A7A60] z-10">
        PlateWise AI Institutional Platform &bull; Zero Open Self-Registration Policy
      </footer>
    </div>
  );
}
