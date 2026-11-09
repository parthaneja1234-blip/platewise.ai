"use client";

import React from "react";
import clsx from "clsx";
import FoodIcon from "@/components/FoodIcon";

interface KenneySpriteLoaderProps {
  variant?: "bobbing" | "steaming" | "plate-spin";
  dishId?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * TIER 2: Cheap Loaders (NO WebGL)
 * Skeletons and inline loading states using Kenney icon sprites
 * with performant CSS animations (bobbing, steaming, plate spin).
 */
export default function KenneySpriteLoader({
  variant = "bobbing",
  dishId = "roti",
  size = "md",
  label,
  className,
}: KenneySpriteLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };

  const animationClass =
    variant === "plate-spin"
      ? "animate-[spin_3s_linear_infinite]"
      : variant === "steaming"
      ? "animate-pulse"
      : "animate-[bounce_2s_ease-in-out_infinite]";

  return (
    <div
      className={clsx(
        "inline-flex flex-col items-center justify-center gap-2 select-none",
        className
      )}
    >
      <div className="relative">
        {/* Animated Kenney Food Icon */}
        <div className={clsx("transition-transform", animationClass)}>
          <FoodIcon dishId={dishId} size={size} />
        </div>

        {/* Steaming ripple effect for "steaming" variant */}
        {variant === "steaming" && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            <span className="w-1 h-3 rounded-full bg-amber-400/60 animate-ping" />
            <span
              className="w-1 h-2 rounded-full bg-amber-400/40 animate-ping"
              style={{ animationDelay: "150ms" }}
            />
          </div>
        )}

        {/* Ground shadow for bobbing */}
        {variant === "bobbing" && (
          <div className="w-8 h-1.5 bg-black/10 rounded-full mx-auto mt-1 blur-[1px] animate-pulse" />
        )}
      </div>

      {label && (
        <span className="text-[11px] font-mono text-[#728479] animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Skeleton Card with subtle Kenney sprite watermark
 */
export function KenneySkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "p-5 rounded-2xl bg-white border border-[#e3ded0] shadow-xs relative overflow-hidden space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-forest-950/5 animate-pulse" />
        <div className="w-16 h-5 rounded-full bg-forest-950/5 animate-pulse" />
      </div>
      <div className="w-3/4 h-5 rounded-lg bg-forest-950/10 animate-pulse" />
      <div className="w-1/2 h-3 rounded bg-forest-950/5 animate-pulse" />
      <div className="pt-2 border-t border-[#e3ded0]/60 flex items-center justify-between">
        <div className="w-20 h-4 rounded bg-forest-950/5 animate-pulse" />
        <div className="w-12 h-4 rounded bg-forest-950/5 animate-pulse" />
      </div>
    </div>
  );
}
