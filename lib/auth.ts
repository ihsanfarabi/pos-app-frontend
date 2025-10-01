export type StoredToken = {
  accessToken: string;
  expiresAt?: number; // epoch ms (optional for v1)
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

let memoryToken: StoredToken | null = null;

export function setToken(token: string, expiresInSeconds?: number): void {
  if (!isBrowser()) return;
  memoryToken = {
    accessToken: token,
    expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
  } satisfies StoredToken;
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  if (!memoryToken) return null;
  if (memoryToken.expiresAt && Date.now() > memoryToken.expiresAt) {
    memoryToken = null;
    return null;
  }
  return memoryToken.accessToken ?? null;
}

export function clearToken(): void {
  if (!isBrowser()) return;
  memoryToken = null;
}

export function hasToken(): boolean {
  const token = getToken();
  return Boolean(token);
}
