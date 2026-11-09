"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "mess_manager" | "admin" | "viewer";
  cafeteria_ids: string[];
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerStudent: (payload: {
    email: string;
    full_name: string;
    password: string;
    join_code: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Sync cookies helper
  const setCookie = (name: string, value: string, days: number = 7) => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
  };

  const deleteCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  };

  const checkAuth = useCallback(async () => {
    try {
      // Check if in demo mode via cookie
      const isDemo = typeof document !== "undefined" && document.cookie.includes("pw_demo=true");
      setIsDemoMode(isDemo);

      const me = await authApi.me();
      setUser(me as UserProfile);
      setCookie("pw_role", me.role);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      deleteCookie("pw_demo");
      setIsDemoMode(false);
      const me = await authApi.me();
      setUser(me as UserProfile);
      setCookie("pw_role", me.role);

      // Role-based redirection
      if (me.role === "student") {
        router.push("/student");
      } else if (me.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (payload: {
    email: string;
    full_name: string;
    password: string;
    join_code: string;
  }) => {
    setIsLoading(true);
    try {
      await authApi.registerStudent(payload);
      deleteCookie("pw_demo");
      setIsDemoMode(false);
      const me = await authApi.me();
      setUser(me as UserProfile);
      setCookie("pw_role", me.role);
      router.push("/student");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      deleteCookie("pw_role");
      deleteCookie("pw_demo");
      deleteCookie("access_token");
      deleteCookie("refresh_token");
      deleteCookie("csrf_token");
      setIsLoading(false);
      router.push("/login");
    }
  };

  const enterDemoMode = () => {
    setCookie("pw_demo", "true");
    setIsDemoMode(true);
    setCookie("pw_role", "manager");
    router.push("/dashboard");
  };

  const exitDemoMode = () => {
    deleteCookie("pw_demo");
    setIsDemoMode(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        login,
        registerStudent,
        logout,
        enterDemoMode,
        exitDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
