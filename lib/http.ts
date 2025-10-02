import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { clearToken, getToken, setToken } from "@/lib/auth";

export type ValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  status?: number;
  fieldErrors?: ValidationErrors;

  constructor(message: string, options?: { status?: number; fieldErrors?: ValidationErrors }) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors;
  }
}

declare module "axios" {
  // Allow custom flags on request config for auth handling.
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_POS_API_BASE || "http://localhost:5001";

type RefreshResponse = {
  accessToken?: string;
  access_token?: string;
  expiresIn?: number;
  expires_in?: number;
};

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const body = (await res.json()) as RefreshResponse;
      const token = body.accessToken ?? body.access_token ?? "";
      if (!token) return null;
      const expiresIn = body.expiresIn ?? body.expires_in;
      setToken(token, expiresIn);
      return token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function setAuthHeader(config: AxiosRequestConfig, token: string) {
  if (!token) return;
  if (!config.headers) {
    config.headers = { Authorization: `Bearer ${token}` };
    return;
  }

  const headers = config.headers;
  if (headers instanceof AxiosHeaders) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    (headers as Record<string, unknown>)["Authorization"] = `Bearer ${token}`;
  }
}

function toCamelCase(key: string) {
  if (!key) return key;
  return key[0].toLowerCase() + key.slice(1);
}

function normalizeValidationErrors(value: unknown): ValidationErrors | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const entries = Object.entries(value as Record<string, unknown>);
  const result: ValidationErrors = {};
  let hasAny = false;

  for (const [rawKey, raw] of entries) {
    const key = toCamelCase(rawKey);
    if (Array.isArray(raw)) {
      const messages = raw
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim());
      if (messages.length > 0) {
        result[key] = messages;
        hasAny = true;
      }
      continue;
    }

    if (typeof raw === "string" && raw.trim().length > 0) {
      result[key] = [raw.trim()];
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
}

function extractErrorDetails(error: AxiosError): { message: string; fieldErrors?: ValidationErrors } {
  const fallback = "Request failed";
  const data = error.response?.data as {
    message?: unknown;
    error?: unknown;
    title?: unknown;
    errors?: unknown;
  } | null;

  const fieldErrors = normalizeValidationErrors(data?.errors);

  const firstFieldMessage = fieldErrors
    ? Object.values(fieldErrors).flat().find((msg) => typeof msg === "string" && msg.trim().length > 0)
    : undefined;

  const messageCandidate =
    data?.message ??
    data?.error ??
    firstFieldMessage ??
    data?.title;

  if (typeof messageCandidate === "string" && messageCandidate.trim().length > 0) {
    return { message: messageCandidate.trim(), fieldErrors };
  }

  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return { message: error.message, fieldErrors };
  }

  return { message: fallback, fieldErrors };
}

function redirectToLogin() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const skipAuth = (config as AxiosRequestConfig & { skipAuth?: boolean }).skipAuth;
  if (skipAuth) return config;
  const token = getToken();
  if (token) setAuthHeader(config, token);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = (error.config ?? {}) as AxiosRequestConfig & {
      skipAuth?: boolean;
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !config.skipAuth) {
      if (!config._retry) {
        config._retry = true;
        const token = await refreshAccessToken();
        if (token) {
          setAuthHeader(config, token);
          return apiClient(config);
        }
      }
      redirectToLogin();
    }

    const { message, fieldErrors } = extractErrorDetails(error);
    return Promise.reject(
      new ApiError(message, {
        status: error.response?.status,
        fieldErrors,
      }),
    );
  },
);

export { apiClient, API_BASE };
