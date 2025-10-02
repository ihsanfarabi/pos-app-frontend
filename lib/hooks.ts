"use client";

import { useEffect, useRef } from "react";
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
import { useNotifications } from "@/components/ui/notification-provider";

export function useMenuPaged(filters: MenuPagedFilters) {
  const query = useQuery(menuPagedQueryOptions(filters));
  useErrorNotification(query.error, "Failed to load menu");
  return query;
}

export function useMenuList() {
  const query = useQuery(menuQueryOptions());
  useErrorNotification(query.error, "Failed to load menu");
  return query;
}

export function useTicketsPaged(filters: TicketPagedFilters) {
  const query = useQuery(ticketsPagedQueryOptions(filters));
  useErrorNotification(query.error, "Failed to load tickets");
  return query;
}

export function useTicketDetail(ticketId: string) {
  const query = useQuery(ticketDetailQueryOptions(ticketId));
  useErrorNotification(query.error, "Failed to load ticket");
  return query;
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
  disableErrorToast?: boolean;
};

export function useApiMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: ApiMutationOptions<TData, TError, TVariables, TContext>,
) {
  const { onErrorMessage, onError, onMutate, disableErrorToast, ...rest } = options;
  const { notifyError } = useNotifications();

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
        const message = resolveErrorMessage(error);
        onErrorMessage(message);
      }
      if (!disableErrorToast) {
        const message = resolveErrorMessage(error);
        notifyError(message);
      }
      onError?.(error, variables, onMutateResult, context);
    },
  });
}

export function useErrorNotification(error: unknown, fallbackMessage?: string) {
  const { notifyError } = useNotifications();
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error) {
      lastMessageRef.current = null;
      return;
    }

    const message = resolveErrorMessage(error, fallbackMessage);
    if (!message) return;
    if (lastMessageRef.current === message) return;

    lastMessageRef.current = message;
    notifyError(message);
  }, [error, fallbackMessage, notifyError]);
}

function resolveErrorMessage(error: unknown, fallback = "Request failed") {
  if (error instanceof Error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  return fallback;
}
