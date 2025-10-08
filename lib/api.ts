import { apiClient } from "@/lib/http";

export type LoginRequest = { email: string; password: string };
export type LoginResponse = { access_token: string; expires_in: number };

export type MenuItemDto = {
  id: string;
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

export async function login(params: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(
    "/api/auth/login",
    { email: params.email, password: params.password },
    { skipAuth: true },
  );
  return res.data;
}

export async function getMenu(): Promise<MenuItemDto[]> {
  const res = await getMenuPaged({ pageIndex: 0, pageSize: 100 });
  return res.data;
}

export type Paginated<T> = {
  data: T[];
  pageIndex: number;
  pageSize: number;
  count: number;
};

export type MenuPagedRequest = { pageIndex?: number; pageSize?: number; q?: string };

export async function getMenuPaged(params: MenuPagedRequest = {}): Promise<Paginated<MenuItemDto>> {
  const res = await apiClient.get<Paginated<MenuItemDto>>("/api/menu", {
    params: {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      q: params.q?.trim() ? params.q.trim() : undefined,
    },
  });
  return res.data;
}

export type TicketListItem = { id: string; status: string; createdAt: string };

export type TicketsPagedRequest = { pageIndex?: number; pageSize?: number };

export async function getTicketsPaged(
  params: TicketsPagedRequest = {},
): Promise<Paginated<TicketListItem>> {
  const res = await apiClient.get<Paginated<TicketListItem>>("/api/tickets", {
    params: {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
    },
  });
  return res.data;
}

export async function createTicket(): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/api/tickets");
  return res.data;
}

export async function getTicket(ticketId: string): Promise<TicketDto> {
  const res = await apiClient.get<TicketDto>(`/api/tickets/${ticketId}`);
  return res.data;
}

export type TicketLineCreateRequest = {
  ticketId: string;
  menuItemId: string;
  qty?: number;
};

export async function addLine(params: TicketLineCreateRequest): Promise<{ ok: boolean } | { id?: string }> {
  const res = await apiClient.post<{ ok: boolean } | { id?: string }>(
    `/api/tickets/${params.ticketId}/lines`,
    { menuItemId: params.menuItemId, qty: params.qty ?? 1 },
  );
  return res.data;
}

export async function payCash(ticketId: string): Promise<{ id: string; status: string; total: number }> {
  const res = await apiClient.post<{ id: string; status: string; total: number }>(
    `/api/tickets/${ticketId}/pay/cash`,
  );
  return res.data;
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export type MeResponse = { id: string; email: string; role: string };

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient.get<MeResponse>("/api/auth/me");
  return res.data;
}

export type MenuItemCreateRequest = { name: string; price: number };

export async function createMenuItem(dto: MenuItemCreateRequest): Promise<{ id: string }> {
  const res = await apiClient.post<{ id: string }>("/api/menu", {
    name: dto.name,
    price: dto.price,
  });
  return res.data;
}

export type MenuItemUpdateRequest = { name: string; price: number };

export async function updateMenuItem(id: string, dto: MenuItemUpdateRequest): Promise<{ id: string }> {
  const res = await apiClient.put<{ id: string }>(`/api/menu/${id}`, {
    name: dto.name,
    price: dto.price,
  });
  return res.data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiClient.delete(`/api/menu/${id}`);
}

export async function logout(): Promise<void> {
  await apiClient.post("/api/auth/logout");
}
