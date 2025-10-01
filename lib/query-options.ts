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

const MENU_PAGE_DEFAULT = 1;
const MENU_PAGE_SIZE_DEFAULT = 20;
const TICKET_PAGE_DEFAULT = 1;
const TICKET_PAGE_SIZE_DEFAULT = 20;

export const menuKeys = {
  root: ["menu"] as const,
  all: () => ["menu"] as const,
  list: () => ["menu", "list"] as const,
  paged: (filters: MenuPagedFilters) =>
    [
      "menu",
      "paged",
      filters.page ?? MENU_PAGE_DEFAULT,
      filters.pageSize ?? MENU_PAGE_SIZE_DEFAULT,
      filters.q?.trim() ?? "",
    ] as const,
};

export const ticketKeys = {
  root: ["tickets"] as const,
  paged: (filters: TicketPagedFilters) =>
    [
      "tickets",
      "paged",
      filters.page ?? TICKET_PAGE_DEFAULT,
      filters.pageSize ?? TICKET_PAGE_SIZE_DEFAULT,
    ] as const,
  detail: (ticketId: string) => ["tickets", "detail", ticketId] as const,
};

export const authKeys = {
  me: () => ["auth", "me"] as const,
};

export function menuPagedQueryOptions(filters: MenuPagedFilters) {
  const params: MenuPagedFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
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
  const params: TicketPagedFilters = {
    page: filters.page,
    pageSize: filters.pageSize,
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

export type MenuPagedResult = Paged<MenuItemDto>;
export type TicketsPagedResult = Paged<TicketListItem>;
export type TicketDetailResult = TicketDto;
export type MeResult = MeResponse;
