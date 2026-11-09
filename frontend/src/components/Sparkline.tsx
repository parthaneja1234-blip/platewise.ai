"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  fillColor?: string;
  height?: number;
  width?: number;
  className?: string;
}

export default function Sparkline({
  data,
  color = "#3e9b66",
  fillColor,
  height = 32,
  width = 80,
  className = "",
}: SparklineProps) {
  const validData = (data || []).filter(
    (d): d is number => typeof d === "number" && !Number.isNaN(d) && Number.isFinite(d)
  );
  if (validData.length < 2) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min === 0 ? 1 : max - min;

  const padX = 2;
  const padY = 4;
  const innerH = height - padY * 2;
  const innerW = width - padX * 2;

  const points = validData.map((d, i) => {
    const x = padX + (i / (validData.length - 1)) * innerW;
    const y = padY + innerH - ((d - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${(padX + innerW).toFixed(1)},${(padY + innerH).toFixed(1)} L ${padX},${(padY + innerH).toFixed(1)} Z`;

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible shrink-0 ${className}`}
      aria-hidden="true"
    >
      {fillColor && <path d={areaD} fill={fillColor} opacity={0.25} />}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
