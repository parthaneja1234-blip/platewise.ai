"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import clsx from "clsx";

export interface CardErrorBoundaryProps {
  cardTitle?: string;
  children: ReactNode;
  className?: string;
  onRetry?: () => void;
  compact?: boolean;
}

interface CardErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for individual Dashboard cards and tables.
 * Prevents a single corrupt field or rendering failure from crashing the entire page.
 */
export default class CardErrorBoundary extends Component<
  CardErrorBoundaryProps,
  CardErrorBoundaryState
> {
  constructor(props: CardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[CardErrorBoundary] Caught error in "${this.props.cardTitle || "Card"}":`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.cardTitle || "this card";
      const isCompact = this.props.compact;

      return (
        <div
          role="alert"
          className={clsx(
            "rounded-2xl border border-amber-500/30 bg-amber-50/40 p-4 flex flex-col justify-between text-left transition-all",
            isCompact ? "min-h-[120px] p-4" : "min-h-[160px] p-6",
            this.props.className
          )}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className={clsx(isCompact ? "w-4 h-4" : "w-5 h-5", "text-amber-600 shrink-0")} />
              <h4 className="font-serif text-sm font-bold text-[#14211a]">
                Could not load {title}
              </h4>
            </div>
            <p className="text-xs text-[#728479] leading-snug">
              Data formatting or telemetry error. Other operations remain active.
            </p>
          </div>

          <div className="pt-3 mt-2 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-800/80">
              Telemetry fallback
            </span>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-amber-500/30 text-amber-900 hover:bg-amber-100/50 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-amber-700" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
