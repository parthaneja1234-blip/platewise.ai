"use client";

import React, { useEffect, useState } from "react";
import { formatNumber, EM_DASH } from "@/lib/formatters";

interface AnimatedNumberProps {
  value: number | null | undefined;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (n: number) => string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  prefix = "",
  suffix = "",
  formatter,
  className,
}: AnimatedNumberProps) {
  const safeEndVal = typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value) ? value : 0;
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    // Respect user's motion preferences
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCurrent(safeEndVal);
      return;
    }

    const startVal = 0;
    const endVal = safeEndVal;
    const startTime = performance.now();

    let frameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = startVal + (endVal - startVal) * ease;
      setCurrent(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setCurrent(endVal);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [safeEndVal, duration]);

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return (
      <span className={`tabular-nums font-mono ${className || ""}`}>
        {EM_DASH}
      </span>
    );
  }

  const formatted = formatter
    ? formatter(current)
    : formatNumber(current, decimals);

  return (
    <span className={`tabular-nums font-mono ${className || ""}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
