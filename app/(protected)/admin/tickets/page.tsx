"use client";

import { useMemo } from "react";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { type TicketListItem } from "@/lib/api";
import { useUrlPaging } from "@/lib/url-paging";
import { useTicketsPaged } from "@/lib/hooks";

export default function AdminTicketsPage() {
  const { page, pageSize, setState } = useUrlPaging({ page: 1, pageSize: 20 });

  const filters = useMemo(() => ({ page, pageSize }), [page, pageSize]);
  const ticketsQuery = useTicketsPaged(filters);

  const columns: ColumnDef<TicketListItem, unknown>[] = useMemo(
    () => [
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
    ],
    [],
  );

  const totalItems = ticketsQuery.data?.total ?? 0;
  const currentPage = ticketsQuery.data?.page ?? page;
  const currentPageSize = ticketsQuery.data?.pageSize ?? pageSize;

  function onPageChange(nextPage: number) {
    setState({ page: nextPage });
  }

  function onPageSizeChange(newSize: number) {
    setState({ page: 1, pageSize: newSize });
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin: Tickets</h1>
      </div>

      <DataTable
        columns={columns}
        data={ticketsQuery.data?.items ?? []}
        page={currentPage}
        pageSize={currentPageSize}
        total={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={ticketsQuery.isFetching}
      />
    </div>
  );
}
