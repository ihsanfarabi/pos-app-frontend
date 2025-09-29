export type MenuItemDto = {
  id: number;
  name: string;
  price: number;
};

export type TicketLineDto = {
  id: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type TicketDto = {
  id: string;
  status: string;
  createdAt: string;
  lines: TicketLineDto[];
  total: number;
};

const API_BASE = process.env.NEXT_PUBLIC_POS_API_BASE || "http://localhost:5001";
import { clearToken, getToken } from "@/lib/auth";

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (!url.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  }
  return res;
}

export type LoginResponse = { accessToken: string; expiresIn: number };

type LoginResponseRaw = {
  accessToken?: string;
  expiresIn?: number;
  access_token?: string;
  expires_in?: number;
};

function normalizeLoginResponse(body: LoginResponseRaw): LoginResponse {
  const accessToken = body.accessToken ?? body.access_token ?? "";
  const expiresIn = body.expiresIn ?? body.expires_in ?? 0;
  return { accessToken, expiresIn };
}

export async function login(params: { email: string; password: string }): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: params.email, password: params.password }),
  });
  const raw = await handleJson<LoginResponseRaw>(res);
  return normalizeLoginResponse(raw);
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function getMenu(): Promise<MenuItemDto[]> {
  const res = await authFetch(`${API_BASE}/api/menu`, { cache: "no-store" });
  return handleJson<MenuItemDto[]>(res);
}

export async function createTicket(): Promise<{ id: string }> {
  const res = await authFetch(`${API_BASE}/api/tickets`, {
    method: "POST",
  });
  return handleJson<{ id: string }>(res);
}

export async function getTicket(ticketId: string): Promise<TicketDto> {
  const res = await authFetch(`${API_BASE}/api/tickets/${ticketId}`, { cache: "no-store" });
  return handleJson<TicketDto>(res);
}

export async function addLine(params: {
  ticketId: string;
  menuItemId: number;
  qty?: number;
}): Promise<{ ok: boolean } | { id?: string }> {
  const res = await authFetch(`${API_BASE}/api/tickets/${params.ticketId}/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menuItemId: params.menuItemId, qty: params.qty ?? 1 }),
  });
  return handleJson(res);
}

export async function payCash(ticketId: string): Promise<{ id: string; status: string; total: number }> {
  const res = await authFetch(`${API_BASE}/api/tickets/${ticketId}/pay/cash`, {
    method: "POST",
  });
  return handleJson(res);
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export type MeResponse = { id: string; email: string; role: string };

export async function getMe(): Promise<MeResponse> {
  const res = await authFetch(`${API_BASE}/api/auth/me`, { cache: "no-store" });
  return handleJson<MeResponse>(res);
}

export async function createMenuItem(dto: { name: string; price: number }): Promise<{ id: string }> {
  const res = await authFetch(`${API_BASE}/api/menu`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: dto.name, price: dto.price }),
  });
  return handleJson(res);
}

export async function updateMenuItem(id: string, dto: { name: string; price: number }): Promise<{ id: string }> {
  const res = await authFetch(`${API_BASE}/api/menu/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: dto.name, price: dto.price }),
  });
  return handleJson(res);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/menu/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    await handleJson(res);
  }
}


