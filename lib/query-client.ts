import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

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

let client: QueryClient | null = null;

export function getQueryClient() {
  if (!client) {
    client = new QueryClient({ defaultOptions: defaultQueryOptions });
  }
  return client;
}

export { defaultQueryOptions };

