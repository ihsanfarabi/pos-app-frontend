"use client";

import { ReactNode, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    retry(failureCount, error) {
      if (error instanceof Response && error.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  },
};

export function AppQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: defaultQueryOptions }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}

