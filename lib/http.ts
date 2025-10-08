import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { clearToken, getToken, setToken } from "@/lib/auth";

export type ValidationErrors = Record<string, string[]>;
export type FieldErrorItem = { code?: string; message: string };
export type RawValidationErrors = Record<string, FieldErrorItem[]>;

export class ApiError extends Error {
  status?: number;
  fieldErrors?: ValidationErrors;
  rawFieldErrors?: RawValidationErrors;
  code?: string;
  traceId?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      fieldErrors?: ValidationErrors;
      rawFieldErrors?: RawValidationErrors;
      code?: string;
      traceId?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.fieldErrors = options?.fieldErrors;
    this.rawFieldErrors = options?.rawFieldErrors;
    this.code = options?.code;
    this.traceId = options?.traceId;
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

function normalizeErrors(value: unknown): { fieldErrors?: ValidationErrors; rawFieldErrors?: RawValidationErrors } {
  if (typeof value !== "object" || value === null) return {};

  const entries = Object.entries(value as Record<string, unknown>);
  const result: ValidationErrors = {};
  const rawResult: RawValidationErrors = {};
  let hasAny = false;

  for (const [rawKey, raw] of entries) {
    const key = toCamelCase(rawKey);
    if (Array.isArray(raw)) {
      // Accept either array of strings or array of { message, code }
      const items: FieldErrorItem[] = [];
      for (const itm of raw) {
        if (typeof itm === "string") {
          const msg = itm.trim();
          if (msg.length > 0) items.push({ message: msg });
          continue;
        }
        if (typeof itm === "object" && itm !== null) {
          const obj = itm as Record<string, unknown>;
          const msg = typeof obj.message === "string" ? obj.message.trim() : "";
          const code = typeof obj.code === "string" ? obj.code : undefined;
          if (msg.length > 0) items.push({ message: msg, code });
          continue;
        }
      }
      if (items.length > 0) {
        result[key] = items.map((i) => i.message);
        rawResult[key] = items;
        hasAny = true;
      }
      continue;
    }

    if (typeof raw === "string" && raw.trim().length > 0) {
      const msg = raw.trim();
      result[key] = [msg];
      rawResult[key] = [{ message: msg }];
      hasAny = true;
    }
  }

  return hasAny ? { fieldErrors: result, rawFieldErrors: rawResult } : {};
}

function extractErrorDetails(error: AxiosError): {
  message: string;
  code?: string;
  traceId?: string;
  fieldErrors?: ValidationErrors;
  rawFieldErrors?: RawValidationErrors;
} {
  const fallback = "Request failed";
  const data = error.response?.data as {
    message?: unknown;
    error?: unknown;
    title?: unknown;
    detail?: unknown;
    errors?: unknown;
    code?: unknown;
    traceId?: unknown;
  } | null;

  const { fieldErrors, rawFieldErrors } = normalizeErrors(data?.errors ?? undefined) ?? {};

  const firstFieldMessage = fieldErrors
    ? Object.values(fieldErrors).flat().find((msg) => typeof msg === "string" && msg.trim().length > 0)
    : undefined;

  const messageCandidate =
    data?.message ??
    data?.error ??
    firstFieldMessage ??
    data?.detail ??
    data?.title;

  const code = typeof data?.code === "string" ? (data?.code as string) : undefined;
  const traceIdBody = typeof data?.traceId === "string" ? (data?.traceId as string) : undefined;
  let traceId = traceIdBody;
  if (!traceId) {
    const headers = error.response?.headers as Record<string, unknown> | undefined;
    const traceHeader = headers && (headers["x-trace-id"] as string | undefined);
    if (typeof traceHeader === "string" && traceHeader.trim().length > 0) traceId = traceHeader;
  }

  if (typeof messageCandidate === "string" && messageCandidate.trim().length > 0) {
    return { message: messageCandidate.trim(), fieldErrors, rawFieldErrors, code, traceId };
  }

  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return { message: error.message, fieldErrors, rawFieldErrors, code, traceId };
  }

  return { message: fallback, fieldErrors, rawFieldErrors, code, traceId };
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

    const { message, fieldErrors, rawFieldErrors, code, traceId } = extractErrorDetails(error);
    return Promise.reject(
      new ApiError(message, {
        status: error.response?.status,
        fieldErrors,
        rawFieldErrors,
        code,
        traceId,
      }),
    );
  },
);

export { apiClient, API_BASE };
