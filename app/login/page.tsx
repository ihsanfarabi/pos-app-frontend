"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, type LoginRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useApiMutation } from "@/lib/hooks";
import type { ValidationErrors } from "@/lib/http";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const redirect = useMemo(() => {
    if (!rawRedirect || !rawRedirect.startsWith("/")) return "/pos";
    try {
      const url = new URL(rawRedirect, window.location.origin);
      return url.pathname + url.search + url.hash;
    } catch {
      return "/pos";
    }
  }, [rawRedirect]);
  const { user, login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleErrorMessage = useCallback((message: string | null) => {
    if (!message) {
      setFormError(null);
      return;
    }
    setFormError(message === "Request failed" ? "Invalid email or password." : message);
  }, []);

  const loginMutation = useApiMutation({
    mutationFn: login,
    onSuccess: async (res) => {
      await authLogin(res.access_token, res.expires_in);
      router.push(redirect);
    },
    onValidationError: setFieldErrors,
    onErrorMessage: handleErrorMessage,
    disableErrorToast: true,
  });

  useEffect(() => {
    if (user) {
      router.replace(redirect);
    }
  }, [user, router, redirect]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    loginMutation.mutate({ email, password } satisfies LoginRequest);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit} aria-busy={loginMutation.isPending}>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                  setFieldErrors((prev) => {
                    if (!prev?.email) return prev;
                    const rest = { ...prev };
                    delete (rest as Record<string, unknown>).email;
                    return Object.keys(rest).length === 0 ? null : rest;
                  });
                }}
                className="border rounded-md h-10 px-3 text-sm bg-background"
                aria-invalid={!!fieldErrors?.email}
              />
              {fieldErrors?.email && fieldErrors.email[0] && (
                <p className="text-sm text-red-600">{fieldErrors.email[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                  setFieldErrors((prev) => {
                    if (!prev?.password) return prev;
                    const rest = { ...prev };
                    delete (rest as Record<string, unknown>).password;
                    return Object.keys(rest).length === 0 ? null : rest;
                  });
                }}
                className="border rounded-md h-10 px-3 text-sm bg-background"
                aria-invalid={!!fieldErrors?.password}
              />
              {fieldErrors?.password && fieldErrors.password[0] && (
                <p className="text-sm text-red-600">{fieldErrors.password[0]}</p>
              )}
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <LoginPageInner />
    </Suspense>
  );
}
