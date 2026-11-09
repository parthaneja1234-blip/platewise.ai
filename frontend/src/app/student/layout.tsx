import React from "react";
import { cookies } from "next/headers";
import { ToastProvider } from "@/components/Toast";
import { AppContextProvider, GraphicsQuality } from "@/context/AppContext";

export const metadata = {
  title: "PlateWise Student — Campus Dining Companion",
  description: "View today's mess menu, RSVP eating or skipping before cutoff, build 3D plates, and rate meals.",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialMessId = cookieStore.get("pw_mess")?.value || "mess-boys-a";
  const initialRole = "student";
  const rawGraphics = cookieStore.get("pw_graphics")?.value;
  const initialGraphicsQuality: GraphicsQuality =
    rawGraphics === "low" || rawGraphics === "off" ? rawGraphics : "auto";

  return (
    <ToastProvider>
      <AppContextProvider
        initialMessId={initialMessId}
        initialRole={initialRole}
        initialGraphicsQuality={initialGraphicsQuality}
      >
        <div className="min-h-[100dvh] bg-[#0A170C] text-[#FAF8F2] flex flex-col justify-start items-center">
          {/* Phone Frame on Laptops / Full width on mobile (max-w-[420px], min 390px viewport) */}
          <div className="w-full max-w-[420px] min-h-[100dvh] bg-[#0E2412] flex flex-col relative shadow-2xl border-x border-[#1B4D2E]/40 overflow-x-hidden">
            {children}
          </div>
        </div>
      </AppContextProvider>
    </ToastProvider>
  );
}
