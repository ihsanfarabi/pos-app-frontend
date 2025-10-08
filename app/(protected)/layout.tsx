"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </Suspense>
  );
}

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTarget = useMemo(() => {
    const qs = searchParams?.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [user, loading, router, redirectTarget]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

