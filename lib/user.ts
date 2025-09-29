"use client";

import { useEffect, useState } from "react";
import { getMe, MeResponse } from "@/lib/api";
import { getToken } from "@/lib/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    (async () => {
      try {
        const me = await getMe();
        setUser(me);
        setError(null);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load user";
        setError(message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { user, loading, error } as const;
}


