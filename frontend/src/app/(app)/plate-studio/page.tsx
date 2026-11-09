"use client";

import React from "react";
import MessTabs from "@/components/shell/MessTabs";
import PlateStudio from "@/components/plate/PlateStudio";
import { Sparkles } from "lucide-react";

export default function PlateStudioPage() {
  return (
    <div className="space-y-4">
      <MessTabs />
      <PlateStudio />
    </div>
  );
}
