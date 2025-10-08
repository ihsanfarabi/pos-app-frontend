"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login, type LoginRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useApiMutation } from "@/lib/hooks";
import type { ValidationErrors } from "@/lib/http";
import FormErrorSummary from "@/components/ui/form-error-summary";
import FormFieldError from "@/components/ui/form-field-error";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const loggedOut = searchParams.get("loggedOut") === "1";
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
  const [traceId, setTraceId] = useState<string | null>(null);

  const handleErrorMessage = useCallback((message: string | null) => {
    if (!message) {
      setFormError(null);
      setTraceId(null);
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
    onApiError: (err) => setTraceId(err.traceId ?? null),
    disableErrorToast: true,
  });

  function validate(): boolean {
    const next: ValidationErrors = {};
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    if (!emailTrimmed) {
      next.email = ["Email is required."];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      next.email = ["Enter a valid email address."];
    }
    if (!passwordTrimmed) {
      next.password = ["Password is required."];
    }
    const has = Object.keys(next).length > 0;
    setFieldErrors(has ? next : null);
    if (has) setFormError(null);
    return !has;
  }

  useEffect(() => {
    if (user) {
      router.replace(redirect);
    }
  }, [user, router, redirect]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
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
          {loggedOut && (
            <p className="mb-2 text-sm text-green-700">You have been signed out.</p>
          )}
          <FormErrorSummary message={formError} traceId={traceId} className="mb-2" />
          <form className="grid gap-4" onSubmit={onSubmit} aria-busy={loginMutation.isPending} noValidate>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
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
                aria-invalid={!!fieldErrors?.email}
                aria-describedby={fieldErrors?.email ? "email-error" : undefined}
              />
              <FormFieldError id="email-error" message={fieldErrors?.email?.[0]} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
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
                aria-invalid={!!fieldErrors?.password}
                aria-describedby={fieldErrors?.password ? "password-error" : undefined}
              />
              <FormFieldError id="password-error" message={fieldErrors?.password?.[0]} />
            </div>
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
