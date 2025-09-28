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
  const res = await fetch(`${API_BASE}/api/menu`, { cache: "no-store" });
  return handleJson<MenuItemDto[]>(res);
}

export async function createTicket(): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/tickets`, {
    method: "POST",
  });
  return handleJson<{ id: string }>(res);
}

export async function getTicket(ticketId: string): Promise<TicketDto> {
  const res = await fetch(`${API_BASE}/api/tickets/${ticketId}`, { cache: "no-store" });
  return handleJson<TicketDto>(res);
}

export async function addLine(params: {
  ticketId: string;
  menuItemId: number;
  qty?: number;
}): Promise<{ ok: boolean } | { id?: string }> {
  const res = await fetch(`${API_BASE}/api/tickets/${params.ticketId}/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menuItemId: params.menuItemId, qty: params.qty ?? 1 }),
  });
  return handleJson(res);
}

export async function payCash(ticketId: string): Promise<{ id: string; status: string; total: number }> {
  const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/pay/cash`, {
    method: "POST",
  });
  return handleJson(res);
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}


