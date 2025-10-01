"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken, setToken as setStoredToken, clearToken as clearStoredToken } from "@/lib/auth";
import { authKeys, meQueryOptions } from "@/lib/query-options";

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
  const queryClient = useQueryClient();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setUser(null);
      queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
      setLoading(false);
      return;
    }

    try {
      const me = await queryClient.fetchQuery({ ...meQueryOptions(), staleTime: 0 });
      setUser({ email: me.email, role: me.role });
    } catch {
      setUser(null);
      clearStoredToken();
      queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (token: string, expiresIn?: number) => {
    setStoredToken(token, expiresIn);
    queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
    await fetchUser();
  }, [fetchUser, queryClient]);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
  }, [queryClient]);

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
