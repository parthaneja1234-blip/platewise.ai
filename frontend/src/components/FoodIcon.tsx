"use client";

import React from "react";
import {
  UtensilsCrossed,
  Soup,
  Coffee,
  Apple,
  Cookie,
  Flame,
  Wheat,
  CircleDot,
  Salad,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";

interface FoodIconProps {
  dishId: string;
  name?: string;
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function FoodIcon({
  dishId,
  name,
  category,
  className,
  size = "md",
}: FoodIconProps) {
  const normId = dishId.toLowerCase().replace(/_/g, "-");

  // Determine icon & styling based on dishId / category
  let IconComponent = UtensilsCrossed;
  let bgGradient = "from-emerald-500/15 to-emerald-600/25";
  let iconColor = "text-emerald-700";
  let ringColor = "border-emerald-500/30";

  if (normId.includes("roti") || normId.includes("bread") || normId.includes("paratha") || normId.includes("naan")) {
    IconComponent = Wheat;
    bgGradient = "from-amber-500/20 to-amber-600/30";
    iconColor = "text-amber-700";
    ringColor = "border-amber-500/30";
  } else if (normId.includes("rice") || normId.includes("biryani") || normId.includes("poha")) {
    IconComponent = CircleDot;
    bgGradient = "from-amber-400/20 to-emerald-500/20";
    iconColor = "text-amber-800";
    ringColor = "border-amber-400/30";
  } else if (normId.includes("dal") || normId.includes("sambar") || normId.includes("soup") || normId.includes("curry") || normId.includes("kadhi")) {
    IconComponent = Soup;
    bgGradient = "from-orange-500/20 to-amber-500/25";
    iconColor = "text-orange-700";
    ringColor = "border-orange-500/30";
  } else if (normId.includes("paneer") || normId.includes("chole") || normId.includes("masala") || normId.includes("subji") || normId.includes("aloo")) {
    IconComponent = Flame;
    bgGradient = "from-amber-600/20 to-orange-600/30";
    iconColor = "text-amber-800";
    ringColor = "border-amber-600/30";
  } else if (normId.includes("salad") || normId.includes("veg") || normId.includes("green")) {
    IconComponent = Salad;
    bgGradient = "from-emerald-500/20 to-teal-500/25";
    iconColor = "text-emerald-700";
    ringColor = "border-emerald-500/30";
  } else if (normId.includes("curd") || normId.includes("raita") || normId.includes("milk") || normId.includes("lassi")) {
    IconComponent = Cookie;
    bgGradient = "from-sky-500/15 to-indigo-500/20";
    iconColor = "text-sky-700";
    ringColor = "border-sky-500/30";
  } else if (normId.includes("tea") || normId.includes("chai") || normId.includes("coffee") || normId.includes("beverage")) {
    IconComponent = Coffee;
    bgGradient = "from-amber-700/20 to-orange-800/25";
    iconColor = "text-amber-800";
    ringColor = "border-amber-700/30";
  } else if (normId.includes("jamun") || normId.includes("halwa") || normId.includes("sweet") || normId.includes("dessert")) {
    IconComponent = Sparkles;
    bgGradient = "from-rose-500/20 to-amber-500/25";
    iconColor = "text-rose-700";
    ringColor = "border-rose-500/30";
  } else if (normId.includes("apple") || normId.includes("banana") || normId.includes("fruit")) {
    IconComponent = Apple;
    bgGradient = "from-emerald-500/20 to-amber-500/20";
    iconColor = "text-emerald-700";
    ringColor = "border-emerald-500/30";
  }

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg text-xs",
    md: "w-10 h-10 rounded-xl text-sm",
    lg: "w-14 h-14 rounded-2xl text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-center shrink-0 bg-gradient-to-tr border shadow-xs transition-transform duration-200",
        bgGradient,
        ringColor,
        sizeClasses[size],
        className
      )}
      title={name || dishId}
    >
      <IconComponent className={clsx(iconSizes[size], iconColor)} />
    </div>
  );
}
