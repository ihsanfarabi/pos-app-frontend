"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createMenuItem, deleteMenuItem, getMenuPaged, MenuItemDto, updateMenuItem } from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { useUrlPaging } from "@/lib/url-paging";

type Editing = { id?: number; name: string; price: number } | null;

export default function AdminMenuPage() {
  const { page: urlPage, pageSize: urlPageSize, q, setState } = useUrlPaging({ page: 1, pageSize: 20, q: "" });
  const [items, setItems] = useState<MenuItemDto[]>([]);
  const [page, setPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);
  const [total, setTotal] = useState(0);
  const [qDraft, setQDraft] = useState(q); // input value
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async (next?: { page?: number; pageSize?: number; q?: string }) => {
    const params = {
      page: next?.page ?? page,
      pageSize: next?.pageSize ?? pageSize,
      q: next?.q ?? q,
    };
    const res = await getMenuPaged(params);
    setItems(res.items);
    setPage(res.page);
    setPageSize(res.pageSize);
    setTotal(res.total);
    setState({ page: res.page, pageSize: res.pageSize, q: params.q });
  }, [page, pageSize, q, setState]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function onStartCreate() {
    setEditing({ name: "", price: 0 });
  }

  function onStartEdit(item: MenuItemDto) {
    setEditing({ id: item.id, name: item.name, price: item.price });
  }

  function onCancel() {
    setEditing(null);
  }

  function onChange(field: keyof NonNullable<Editing>, value: string) {
    setEditing((prev) => (prev ? { ...prev, [field]: field === "price" ? Number(value) : value } as Editing : prev));
  }

  function onSave() {
    if (!editing) return;
    startTransition(async () => {
      try {
        if (editing.id != null) {
          await updateMenuItem(String(editing.id), { name: editing.name.trim(), price: editing.price });
        } else {
          await createMenuItem({ name: editing.name.trim(), price: editing.price });
        }
        setEditing(null);
        await refresh();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save";
        setError(message);
      }
    });
  }

const onDelete = useCallback((id: number) => {
  startTransition(async () => {
    try {
      await deleteMenuItem(String(id));
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      setError(message);
    }
  });
}, [refresh]);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ page: 1, q: qDraft });
    void refresh({ page: 1, q: qDraft });
  }

  function onPageSizeChange(newSize: number) {
    void refresh({ page: 1, pageSize: newSize });
  }

  const columns: ColumnDef<MenuItemDto, unknown>[] = useMemo(() => [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => <span>{row.original.name}</span>,
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: ({ row }) => <span>{new Intl.NumberFormat("id-ID").format(row.original.price)}</span>,
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right space-x-2">
          <button onClick={() => onStartEdit(row.original)} className="rounded border px-2 py-1">Edit</button>
          <button onClick={() => onDelete(row.original.id)} className="rounded border px-2 py-1">Delete</button>
        </div>
      ),
    },
], [onDelete]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Admin: Menu</h1>
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            placeholder="Search..."
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            className="border rounded-md h-9 px-3 text-sm"
          />
          <button className="rounded border px-3 py-2 text-sm" type="submit">Search</button>
        </form>
        <div className="flex items-center gap-2">
          <button onClick={onStartCreate} className="rounded bg-black text-white px-3 py-2 text-sm">New Item</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {editing && (
        <div className="rounded border p-4 space-y-3">
          <div className="grid gap-2">
            <label className="text-sm">Name</label>
            <input className="border rounded-md h-10 px-3 text-sm" value={editing.name} onChange={(e) => onChange("name", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Price</label>
            <input type="number" className="border rounded-md h-10 px-3 text-sm" value={editing.price} onChange={(e) => onChange("price", e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <button disabled={isPending} onClick={onSave} className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50">Save</button>
            <button disabled={isPending} onClick={onCancel} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Cancel</button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(p) => refresh({ page: p })}
        onPageSizeChange={(s) => onPageSizeChange(s)}
      />
    </div>
  );
}

