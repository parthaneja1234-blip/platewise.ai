"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import clsx from "clsx";

export interface ToastMessage {
  id: string;
  type?: "success" | "warning" | "error" | "info";
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastMessage = { ...msg, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, msg.duration || 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container floating at top-right */}
      <div className="fixed top-20 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200",
              t.type === "success" &&
                "bg-[#0e2412]/95 border-emerald-500/40 text-[#faf8f2]",
              t.type === "warning" &&
                "bg-[#2d1b09]/95 border-amber-500/40 text-[#faf8f2]",
              t.type === "error" &&
                "bg-[#2d0909]/95 border-rose-500/40 text-[#faf8f2]",
              (!t.type || t.type === "info") &&
                "bg-[#0e2412]/95 border-amber-500/40 text-[#faf8f2]"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              {t.type === "warning" && (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              {t.type === "error" && (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              )}
              {(!t.type || t.type === "info") && (
                <Info className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">{t.title}</div>
              {t.description && (
                <div className="text-[11px] text-[#8fa896] mt-0.5 leading-snug">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg text-[#8fa896] hover:text-[#faf8f2] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (msg: Omit<ToastMessage, "id">) => {
        console.log("Toast:", msg.title, msg.description);
      },
    };
  }
  return context;
}
