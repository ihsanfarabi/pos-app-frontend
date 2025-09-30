"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PagingState = {
  page: number;
  pageSize: number;
  q?: string;
};

export function useUrlPaging(defaults: { page?: number; pageSize?: number; q?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page") ?? "") || defaults.page || 1;
  const initialPageSize = Number(searchParams.get("pageSize") ?? "") || defaults.pageSize || 20;
  const initialQ = (searchParams.get("q") ?? defaults.q ?? "").toString().trim();

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [q, setQ] = useState(initialQ);

  const setState = useCallback((next: Partial<PagingState>) => {
    const newPage = next.page ?? page;
    const newPageSize = next.pageSize ?? pageSize;
    const newQ = next.q ?? q;

    setPage(newPage);
    setPageSize(newPageSize);
    setQ(newQ);

    const qs = new URLSearchParams();
    if (newQ && newQ.trim()) qs.set("q", newQ.trim());
    if (newPage && newPage !== 1) qs.set("page", String(newPage));
    if (newPageSize && newPageSize !== 10) qs.set("pageSize", String(newPageSize));
    const href = qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
    router.replace(href);
  }, [page, pageSize, q, pathname, router]);

  return useMemo(() => ({ page, pageSize, q, setState }), [page, pageSize, q, setState]);
}


