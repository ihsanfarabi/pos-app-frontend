"use client";

import { useEffect, useState } from "react";
import { getMe, MeResponse } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/http";

export function useCurrentUser() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let token = getToken();
        if (!token) {
          token = await refreshAccessToken();
        }
        if (!token) {
          setUser(null);
          setError(null);
          return;
        }
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

