import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
  getMenu,
  getMenuPaged,
  getTicket,
  getTicketsPaged,
  getMe,
  type MenuItemDto,
  type Paged,
  type TicketDto,
  type TicketListItem,
  type MeResponse,
} from "@/lib/api";

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
  all: () => [...menuKeys.root] as const,
  paged: (filters: MenuPagedFilters) => [...menuKeys.root, "paged", filters] as const,
  list: () => [...menuKeys.root, "list"] as const,
};

export const ticketKeys = {
  root: ["tickets"] as const,
  paged: (filters: TicketPagedFilters) => [...ticketKeys.root, "paged", filters] as const,
  detail: (ticketId: string) => [...ticketKeys.root, "detail", ticketId] as const,
};

export const authKeys = {
  me: () => ["auth", "me"] as const,
};

export function menuPagedQueryOptions(filters: MenuPagedFilters) {
  const normalized: MenuPagedFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
    q: filters.q?.trim() ? filters.q.trim() : undefined,
  };

  return queryOptions({
    queryKey: menuKeys.paged(normalized),
    queryFn: () => getMenuPaged(normalized),
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
  const normalized: TicketPagedFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
  };

  return queryOptions({
    queryKey: ticketKeys.paged(normalized),
    queryFn: () => getTicketsPaged(normalized),
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

export type MenuPagedResult = Paged<MenuItemDto>;
export type TicketsPagedResult = Paged<TicketListItem>;
export type TicketDetailResult = TicketDto;
export type MeResult = MeResponse;

