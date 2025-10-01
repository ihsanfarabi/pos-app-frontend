"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout as logoutRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useApiMutation } from "@/lib/hooks";

export default function LogoutPage() {
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const { mutateAsync: performLogout } = useApiMutation({
    mutationFn: logoutRequest,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await performLogout();
      } catch {}
      authLogout();
      if (active) router.replace("/login");
    })();
    return () => {
      active = false;
    };
  }, [performLogout, authLogout, router]);

  return <p className="p-6">Signing out...</p>;
}
