"use client";

import { createContext, useContext, useMemo, useCallback, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

function readToken(): string | null {
  return typeof window !== "undefined" ? getToken() : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(Boolean(readToken()));
  }, []);

  const meQuery = useQuery({
    ...meQueryOptions(),
    enabled: hasToken === true,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      clearStoredToken();
      setHasToken(false);
      queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
    }
  }, [meQuery.isError, queryClient]);

  const user = useMemo<User>(() => {
    const data = meQuery.data;
    if (!data) return null;
    return { email: data.email, role: data.role };
  }, [meQuery.data]);

  const loading = hasToken === null || (hasToken === true && meQuery.isPending);

  const login = useCallback(async (token: string, expiresIn?: number) => {
    setStoredToken(token, expiresIn);
    setHasToken(true);
    try {
      await queryClient.fetchQuery(meQueryOptions());
    } catch (error) {
      clearStoredToken();
      setHasToken(false);
      queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
      throw error;
    }
  }, [queryClient]);

  const logout = useCallback(() => {
    clearStoredToken();
    setHasToken(false);
    queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const token = readToken();
    if (!token) {
      clearStoredToken();
      setHasToken(false);
      queryClient.removeQueries({ queryKey: authKeys.me(), exact: false });
      return;
    }
    setHasToken(true);
    await queryClient.invalidateQueries({ queryKey: authKeys.me(), exact: false });
    await queryClient.refetchQueries({ queryKey: authKeys.me(), exact: false });
  }, [queryClient]);

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

