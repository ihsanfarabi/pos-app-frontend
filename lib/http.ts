import axios, { AxiosError, AxiosHeaders, type AxiosRequestConfig } from "axios";
import { clearToken, getToken } from "@/lib/auth";

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

async function refreshAccessToken(): Promise<string | null> {
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
      const { setToken } = await import("@/lib/auth");
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

function extractErrorMessage(error: AxiosError): string {
  const fallback = "Request failed";
  const data = error.response?.data as { message?: unknown; error?: unknown } | undefined;
  const messageCandidate = data?.message ?? data?.error;
  if (typeof messageCandidate === "string" && messageCandidate.trim()) {
    return messageCandidate;
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
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

    const message = extractErrorMessage(error);
    return Promise.reject(new Error(message));
  },
);

export { apiClient, API_BASE };
