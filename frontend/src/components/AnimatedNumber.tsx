"use client";

import React, { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
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
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    // Respect user's motion preferences
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCurrent(value);
      return;
    }

    const startVal = 0;
    const endVal = value;
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
  }, [value, duration]);

  const formatted = formatter
    ? formatter(current)
    : decimals > 0
    ? current.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : Math.round(current).toLocaleString("en-IN");

  return (
    <span className={`tabular-nums font-mono ${className || ""}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
