import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  getMenu,
  getMenuPaged,
  getTicket,
  getTicketsPaged,
  getMe,
  type MenuItemDto,
  type Paginated,
  type TicketDto,
  type TicketListItem,
  type MeResponse,
} from "@/lib/api";
import { PAGING_DEFAULTS } from "@/lib/paging";

export type MenuPagedFilters = {
  page: number;
  pageSize: number;
  q?: string;
};

export type TicketPagedFilters = {
  page: number;
  pageSize: number;
};

export const menuKeys = {
  root: ["menu"] as const,
  all: () => ["menu"] as const,
  list: () => ["menu", "list"] as const,
  paged: (filters: MenuPagedFilters) =>
    [
      "menu",
      "paged",
      filters.page ?? PAGING_DEFAULTS.page,
      filters.pageSize ?? PAGING_DEFAULTS.pageSize,
      filters.q?.trim() ?? PAGING_DEFAULTS.q,
    ] as const,
};

export const ticketKeys = {
  root: ["tickets"] as const,
  paged: (filters: TicketPagedFilters) =>
    [
      "tickets",
      "paged",
      filters.page ?? PAGING_DEFAULTS.page,
      filters.pageSize ?? PAGING_DEFAULTS.pageSize,
    ] as const,
  detail: (ticketId: string) => ["tickets", "detail", ticketId] as const,
};

export const authKeys = {
  me: () => ["auth", "me"] as const,
};

export function menuPagedQueryOptions(filters: MenuPagedFilters) {
  const normalizedPage = filters.page ?? PAGING_DEFAULTS.page;
  const params = {
    pageIndex: Math.max(0, normalizedPage - 1),
    pageSize: filters.pageSize ?? PAGING_DEFAULTS.pageSize,
    q: filters.q?.trim() ? filters.q.trim() : undefined,
  };

  return queryOptions({
    queryKey: menuKeys.paged(filters),
    queryFn: () => getMenuPaged(params),
    placeholderData: keepPreviousData,
  });
}

export function menuQueryOptions() {
  return queryOptions({
    queryKey: [...menuKeys.list()],
    queryFn: () => getMenu(),
  });
}

export function ticketsPagedQueryOptions(filters: TicketPagedFilters) {
  const normalizedPage = filters.page ?? PAGING_DEFAULTS.page;
  const params = {
    pageIndex: Math.max(0, normalizedPage - 1),
    pageSize: filters.pageSize ?? PAGING_DEFAULTS.pageSize,
  };

  return queryOptions({
    queryKey: ticketKeys.paged(filters),
    queryFn: () => getTicketsPaged(params),
    placeholderData: keepPreviousData,
  });
}

export function ticketDetailQueryOptions(ticketId: string) {
  return queryOptions({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => getTicket(ticketId),
  });
}

export function meQueryOptions() {
  return queryOptions({
    queryKey: authKeys.me(),
    queryFn: () => getMe(),
    staleTime: 5 * 60 * 1000,
  });
}

export type MenuPagedResult = Paginated<MenuItemDto>;
export type TicketsPagedResult = Paginated<TicketListItem>;
export type TicketDetailResult = TicketDto;
export type MeResult = MeResponse;
