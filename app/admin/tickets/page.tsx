"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { getMe, getTicketsPaged, type TicketListItem } from "@/lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function AdminTicketsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams.get("page") ?? "") || 1;
  const initialPageSize = Number(searchParams.get("pageSize") ?? "") || 20;

  const [items, setItems] = useState<TicketListItem[]>([]);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async (next?: { page?: number; pageSize?: number }) => {
    const params = {
      page: next?.page ?? page,
      pageSize: next?.pageSize ?? pageSize,
    };
    const res = await getTicketsPaged(params);
    setItems(res.items);
    setPage(res.page);
    setPageSize(res.pageSize);
    setTotal(res.total);

    // update URL
    const qs = new URLSearchParams();
    if (res.page && res.page !== 1) qs.set("page", String(res.page));
    if (res.pageSize && res.pageSize !== 10) qs.set("pageSize", String(res.pageSize));
    const href = qs.toString() ? `${pathname}?${qs.toString()}` : pathname;
    router.replace(href);
  }, [page, pageSize, pathname, router]);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        if (me.role !== "admin") {
          router.replace("/pos");
          return;
        }
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load";
        setError(message);
      }
    })();
  }, [router, refresh]);

  const onPageSizeChange = useCallback((newSize: number) => {
    startTransition(() => {
      void refresh({ page: 1, pageSize: newSize });
    });
  }, [refresh]);

  const columns: ColumnDef<TicketListItem, unknown>[] = useMemo(() => [
    {
      header: "ID",
      accessorKey: "id",
      cell: ({ row }) => <span className="font-mono">{row.original.id.slice(0, 8)}</span>,
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <span>{row.original.status}</span>,
    },
  ], []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Tickets</h1>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => refresh({ page: p })}
        onPageSizeChange={onPageSizeChange}
        isLoading={isPending}
      />
    </div>
  );
}


