"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        await fetch((process.env.NEXT_PUBLIC_POS_API_BASE || "http://localhost:5001") + "/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {}
      logout();
      router.replace("/login");
    })();
  }, [router, logout]);

  return <p className="p-6">Signing out...</p>;
}


