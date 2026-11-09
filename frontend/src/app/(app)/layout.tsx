import React from "react";
import { cookies } from "next/headers";
import AppShell from "@/components/shell/AppShell";
import { AppContextProvider, GraphicsQuality } from "@/context/AppContext";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialMessId = cookieStore.get("pw_mess")?.value || "mess-boys-a";
  const initialRole = cookieStore.get("pw_role")?.value || "manager";
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
        <AppShell>{children}</AppShell>
      </AppContextProvider>
    </ToastProvider>
  );
}


