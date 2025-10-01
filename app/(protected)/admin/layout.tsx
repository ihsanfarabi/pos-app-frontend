"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      router.replace("/pos");
    }
  }, [user, loading, router]);

  // Still loading
  if (loading) {
    return null; // Parent layout handles loading
  }

  // Not admin - show nothing while redirecting
  if (!user || user.role !== "admin") {
    return null;
  }

  // Admin authenticated - render children
  return <>{children}</>;
}

