"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        await fetch((process.env.NEXT_PUBLIC_POS_API_BASE || "http://localhost:5001") + "/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch {}
      clearToken();
      router.replace("/login");
    })();
  }, [router]);
  return <p className="p-6">Signing out...</p>;
}


