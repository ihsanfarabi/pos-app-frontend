"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getToken, setToken as setStoredToken, clearToken as clearStoredToken } from "@/lib/auth";
import { getMe } from "@/lib/api";

type User = {
  email: string;
  role: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (token: string, expiresIn?: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await getMe();
      setUser({ email: me.email, role: me.role });
    } catch {
      setUser(null);
      clearStoredToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (token: string, expiresIn?: number) => {
    setStoredToken(token, expiresIn);
    await fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

