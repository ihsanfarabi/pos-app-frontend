import { useMutation, useQuery, type UseMutationOptions } from "@tanstack/react-query";
import {
  menuPagedQueryOptions,
  menuQueryOptions,
  ticketDetailQueryOptions,
  ticketsPagedQueryOptions,
  type MenuPagedFilters,
  type MenuPagedResult,
  type TicketDetailResult,
  type TicketPagedFilters,
  type TicketsPagedResult,
} from "@/lib/query-options";

export function useMenuPaged(filters: MenuPagedFilters) {
  return useQuery(menuPagedQueryOptions(filters));
}

export function useMenuList() {
  return useQuery(menuQueryOptions());
}

export function useTicketsPaged(filters: TicketPagedFilters) {
  return useQuery(ticketsPagedQueryOptions(filters));
}

export function useTicketDetail(ticketId: string) {
  return useQuery(ticketDetailQueryOptions(ticketId));
}

export type { MenuPagedFilters, MenuPagedResult, TicketsPagedResult, TicketPagedFilters, TicketDetailResult };

type ErrorSetter = (message: string | null) => void;

type ApiMutationOptions<TData, TError, TVariables, TContext> = UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> & {
  onErrorMessage?: ErrorSetter;
};

export function useApiMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: ApiMutationOptions<TData, TError, TVariables, TContext>,
) {
  const { onErrorMessage, onError, onMutate, ...rest } = options;

  return useMutation({
    ...rest,
    onMutate: (variables, context) => {
      if (onErrorMessage) onErrorMessage(null);
      if (onMutate) {
        return onMutate(variables, context);
      }
      return undefined as unknown as TContext;
    },
    onError: (error, variables, onMutateResult, context) => {
      if (onErrorMessage) {
        let message = "Request failed";
        if (error instanceof Error && error.message.trim()) {
          message = error.message;
        } else if (typeof error === "string" && error.trim()) {
          message = error.trim();
        }
        onErrorMessage(message);
      }
      onError?.(error, variables, onMutateResult, context);
    },
  });
}
