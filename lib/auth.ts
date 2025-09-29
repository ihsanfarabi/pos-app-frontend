export type StoredToken = {
  accessToken: string;
  expiresAt?: number; // epoch ms (optional for v1)
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

const TOKEN_KEY = "posapp.accessToken";

export function setToken(token: string, expiresInSeconds?: number): void {
  if (!isBrowser()) return;
  try {
    const stored: StoredToken = {
      accessToken: token,
      expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
    };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
  } catch {}
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}


