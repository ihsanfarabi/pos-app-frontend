"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createMenuItem,
  deleteMenuItem,
  MenuItemDto,
  updateMenuItem,
} from "@/lib/api";
import { DataTable, type ColumnDef } from "@/components/data-table";
import { useUrlPaging } from "@/lib/url-paging";
import { menuKeys } from "@/lib/query-options";
import { useApiMutation, useMenuPaged } from "@/lib/hooks";
import type { ValidationErrors } from "@/lib/http";

type Editing = { id?: number; name: string; price: number } | null;

export default function AdminMenuPage() {
  const { page, pageSize, q, setState } = useUrlPaging({ page: 1, pageSize: 20, q: "" });
  const [editing, setEditing] = useState<Editing>(null);
  const [qDraft, setQDraft] = useState(q);
  const [formErrors, setFormErrors] = useState<ValidationErrors | null>(null);

  useEffect(() => {
    setQDraft(q);
  }, [q]);

  const filters = useMemo(() => ({ page, pageSize, q }), [page, pageSize, q]);
  const menuQuery = useMenuPaged(filters);
  const queryClient = useQueryClient();

  const handleValidationError = useCallback((errors: ValidationErrors | null) => {
    setFormErrors(errors);
  }, []);

  const createMutation = useApiMutation({
    mutationFn: (dto: { name: string; price: number }) =>
      createMenuItem({ name: dto.name.trim(), price: dto.price }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: menuKeys.all() }),
    onValidationError: handleValidationError,
  });

  const updateMutation = useApiMutation({
    mutationFn: (payload: { id: number; name: string; price: number }) =>
      updateMenuItem(String(payload.id), {
        name: payload.name.trim(),
        price: payload.price,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: menuKeys.all() }),
    onValidationError: handleValidationError,
  });

  const deleteMutation = useApiMutation({
    mutationFn: (id: number) => deleteMenuItem(String(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: menuKeys.all() }),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function onStartCreate() {
    setEditing({ name: "", price: 0 });
    setFormErrors(null);
  }

  function onStartEdit(item: MenuItemDto) {
    setEditing({ id: item.id, name: item.name, price: item.price });
    setFormErrors(null);
  }

  function onCancel() {
    setEditing(null);
    setFormErrors(null);
  }

  function onChange(field: keyof NonNullable<Editing>, value: string) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === "price" ? Number(value) : value,
          }
        : prev,
    );
    setFormErrors((prev) => {
      if (!prev) return prev;
      if (!(field in prev)) return prev;
      const { [field]: _removed, ...rest } = prev;
      return Object.keys(rest).length === 0 ? null : rest;
    });
  }

  async function onSave() {
    if (!editing) return;
    const payload = { ...editing, name: editing.name.trim() };

    try {
      if (payload.id != null) {
        await updateMutation.mutateAsync({ id: payload.id, name: payload.name, price: payload.price });
      } else {
        await createMutation.mutateAsync({ name: payload.name, price: payload.price });
      }
      setEditing(null);
      setFormErrors(null);
    } catch {
      // error already handled via useApiMutation
    }
  }

  const onDelete = useCallback(
    async (id: number) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // error already handled via useApiMutation
      }
    },
    [deleteMutation],
  );

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ page: 1, q: qDraft });
  }

  function onPageChange(nextPage: number) {
    setState({ page: nextPage });
  }

  function onPageSizeChange(newSize: number) {
    setState({ page: 1, pageSize: newSize });
  }

  const columns: ColumnDef<MenuItemDto, unknown>[] = useMemo(
    () => [
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
            <button onClick={() => onStartEdit(row.original)} className="rounded border px-2 py-1">
              Edit
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              disabled={isDeleting}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [isDeleting, onDelete],
  );

  const totalItems = menuQuery.data?.total ?? 0;
  const currentPage = menuQuery.data?.page ?? page;
  const currentPageSize = menuQuery.data?.pageSize ?? pageSize;

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
          <button className="rounded border px-3 py-2 text-sm" type="submit">
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <button onClick={onStartCreate} className="rounded bg-black text-white px-3 py-2 text-sm">
            New Item
          </button>
        </div>
      </div>

      {editing && (
        <div className="rounded border p-4 space-y-3">
          <div className="grid gap-2">
            <label className="text-sm">Name</label>
            <input
              className="border rounded-md h-10 px-3 text-sm"
              value={editing.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
            {formErrors?.name && formErrors.name[0] && (
              <p className="text-sm text-red-600">{formErrors.name[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Price</label>
            <input
              type="number"
              className="border rounded-md h-10 px-3 text-sm"
              value={editing.price}
              onChange={(e) => onChange("price", e.target.value)}
            />
            {formErrors?.price && formErrors.price[0] && (
              <p className="text-sm text-red-600">{formErrors.price[0]}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isSaving}
              onClick={onSave}
              className="rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              disabled={isSaving}
              onClick={onCancel}
              className="rounded border px-3 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={menuQuery.data?.items ?? []}
        page={currentPage}
        pageSize={currentPageSize}
        total={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={menuQuery.isFetching}
      />
    </div>
  );
}
