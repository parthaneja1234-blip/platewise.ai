import React from "react";
import RouteLoader3D from "@/components/3d/RouteLoader3D";

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center">
      <RouteLoader3D />
    </div>
  );
}
