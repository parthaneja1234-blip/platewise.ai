"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { demoApi, Mess } from "@/lib/api";
import { useToast } from "@/components/Toast";

export interface Role {
  id: "manager" | "admin" | "student";
  name: string;
  badge: string;
}

export const ROLES: Role[] = [
  { id: "manager", name: "Mess Manager", badge: "Operator" },
  { id: "admin", name: "Admin / Warden", badge: "Superuser" },
  { id: "student", name: "Student", badge: "Diner" },
];

export const DEFAULT_MESSES: Mess[] = [
  {
    id: "mess-boys-a",
    name: "Boys Hostel Mess A",
    capacity: 850,
    type: "hostel_mess",
    current_turnout_pct: 88,
    location: "North Campus - Block 4",
    campus_location: "North Campus - Block 4",
    meal_times: {
      breakfast: "07:30 - 09:30",
      lunch: "12:00 - 14:30",
      dinner: "19:30 - 21:30",
    },
  },
  {
    id: "mess-central",
    name: "Central Cafeteria",
    capacity: 1200,
    type: "central_court",
    current_turnout_pct: 76,
    location: "Student Activity Center (SAC)",
    campus_location: "Student Activity Center (SAC)",
    meal_times: {
      breakfast: "08:00 - 10:00",
      lunch: "12:00 - 15:00",
      dinner: "19:00 - 22:00",
    },
  },
];

export type GraphicsQuality = "auto" | "low" | "off";

interface AppContextValue {
  messes: Mess[];
  activeMessId: string;
  activeMess: Mess;
  setActiveMessId: (id: string) => void;
  activeRole: Role;
  setActiveRole: (roleId: string) => void;
  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  isAddMessOpen: boolean;
  setIsAddMessOpen: (open: boolean) => void;
  addMess: (payload: {
    name: string;
    capacity: number;
    type?: string;
    location?: string;
    breakfast_time?: string;
    lunch_time?: string;
    dinner_time?: string;
  }) => Promise<Mess>;
  refreshMesses: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

interface AppContextProviderProps {
  children: React.ReactNode;
  initialMessId?: string;
  initialRole?: string;
  initialGraphicsQuality?: GraphicsQuality;
}

export function AppContextProvider({
  children,
  initialMessId = "mess-boys-a",
  initialRole = "manager",
  initialGraphicsQuality = "auto",
}: AppContextProviderProps) {
  const { toast } = useToast();

  const [messes, setMesses] = useState<Mess[]>(DEFAULT_MESSES);
  const [activeMessId, setActiveMessIdState] = useState<string>(initialMessId);
  const [activeRoleId, setActiveRoleIdState] = useState<string>(initialRole);
  const [graphicsQuality, setGraphicsQualityState] = useState<GraphicsQuality>(initialGraphicsQuality);
  const [isAddMessOpen, setIsAddMessOpen] = useState(false);

  // Sync messes from API on client mount without triggering hydration mismatches
  const refreshMesses = useCallback(async () => {
    try {
      const res = await demoApi.getMesses();
      if (res.messes && res.messes.length > 0) {
        setMesses(res.messes);
      }
    } catch (err) {
      console.warn("Could not fetch remote messes, using local state:", err);
    }
  }, []);

  useEffect(() => {
    refreshMesses();
  }, [refreshMesses]);

  // Set active mess + persist in cookie
  const setActiveMessId = useCallback(
    (id: string) => {
      setActiveMessIdState(id);
      setCookie("pw_mess", id);
      const target = messes.find((m) => m.id === id);
      if (target) {
        toast({ title: `Switched active mess to ${target.name}`, type: "info" });
      }
    },
    [messes, toast]
  );

  // Set active role + persist in cookie
  const setActiveRole = useCallback(
    (roleId: string) => {
      const found = ROLES.find((r) => r.id === roleId);
      if (found) {
        setActiveRoleIdState(roleId);
        setCookie("pw_role", roleId);
        toast({ title: `Switched perspective to ${found.name} (${found.badge})`, type: "info" });
      }
    },
    [toast]
  );

  // Add new mess hall
  const addMess = useCallback(
    async (payload: {
      name: string;
      capacity: number;
      type?: string;
      location?: string;
      breakfast_time?: string;
      lunch_time?: string;
      dinner_time?: string;
    }): Promise<Mess> => {
      try {
        const res = await demoApi.createMess(payload);
        const created = res.mess;
        setMesses((prev) => {
          // Avoid duplicate ids
          const filtered = prev.filter((m) => m.id !== created.id);
          return [...filtered, created];
        });
        setActiveMessIdState(created.id);
        setCookie("pw_mess", created.id);
        setIsAddMessOpen(false);
        toast({ title: `Dining hall "${created.name}" created successfully!`, type: "success" });
        return created;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create mess hall";
        toast({ title: msg, type: "error" });
        throw err;
      }
    },
    [toast]
  );

  // Set graphics quality + persist in cookie
  const setGraphicsQuality = useCallback(
    (quality: GraphicsQuality) => {
      setGraphicsQualityState(quality);
      setCookie("pw_graphics", quality);
      toast({
        title: `Graphics setting updated to ${quality.toUpperCase()}`,
        type: "info",
      });
    },
    [toast]
  );

  // Active mess object
  const activeMess = useMemo(() => {
    return (
      messes.find((m) => m.id === activeMessId) ||
      DEFAULT_MESSES.find((m) => m.id === activeMessId) ||
      messes[0] ||
      DEFAULT_MESSES[0]
    );
  }, [messes, activeMessId]);

  // Active role object
  const activeRole = useMemo(() => {
    return ROLES.find((r) => r.id === activeRoleId) || ROLES[0];
  }, [activeRoleId]);

  const value = useMemo(
    () => ({
      messes,
      activeMessId,
      activeMess,
      setActiveMessId,
      activeRole,
      setActiveRole,
      graphicsQuality,
      setGraphicsQuality,
      isAddMessOpen,
      setIsAddMessOpen,
      addMess,
      refreshMesses,
    }),
    [
      messes,
      activeMessId,
      activeMess,
      setActiveMessId,
      activeRole,
      setActiveRole,
      graphicsQuality,
      setGraphicsQuality,
      isAddMessOpen,
      setIsAddMessOpen,
      addMess,
      refreshMesses,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
