"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PAGING_DEFAULTS } from "@/lib/paging";

export type PagingState = {
  page: number;
  pageSize: number;
  q?: string;
};

function parsePositiveInt(value: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function useUrlPaging(defaults: { page?: number; pageSize?: number; q?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultPage = defaults.page ?? PAGING_DEFAULTS.page;
  const defaultPageSize = defaults.pageSize ?? PAGING_DEFAULTS.pageSize;
  const defaultQ = defaults.q ?? PAGING_DEFAULTS.q;

  const page = parsePositiveInt(searchParams.get("page")) ?? defaultPage;
  const pageSize = parsePositiveInt(searchParams.get("pageSize")) ?? defaultPageSize;
  const q = (searchParams.get("q") ?? defaultQ ?? "").toString().trim();

  const setState = useCallback(
    (next: Partial<PagingState>) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextPage = next.page ?? page;
      if (!nextPage || nextPage === defaultPage) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }

      const nextPageSize = next.pageSize ?? pageSize;
      if (!nextPageSize || nextPageSize === defaultPageSize) {
        params.delete("pageSize");
      } else {
        params.set("pageSize", String(nextPageSize));
      }

      const nextQ = next.q ?? q;
      const trimmedQ = nextQ?.trim?.() ?? "";
      if (!trimmedQ || trimmedQ === defaultQ.trim()) {
        params.delete("q");
      } else {
        params.set("q", trimmedQ);
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentHref = currentQuery ? `${pathname}?${currentQuery}` : pathname;
      if (nextHref === currentHref) return;

      router.replace(nextHref);
    },
    [defaultPage, defaultPageSize, defaultQ, page, pageSize, q, router, pathname, searchParams],
  );

  return useMemo(() => ({ page, pageSize, q, setState }), [page, pageSize, q, setState]);
}

